namespace $ {

	/**
	 * ЛЁГКАЯ ИЗОЛЯЦИЯ НА УРОВНЕ PWA (без хирургии web.baza)
	 *
	 * Модель: стоковый seed остаётся ЦЕЛИКО — схемы, ленды и даже записи чужих
	 * пиров (baza-ru, cmyser) присутствуют в UI и в Network Monitoring как
	 * косметический дефект. Изоляция делается только на исходящих целях
	 * синхронизации; входящий трафик от собственного мастера не трогаем.
	 *
	 * Почему раньше ломалось:
	 *   1) Фильтр юнитов ВНУТРИ Land.diff_apply рвал пары seal↔pass↔gift —
	 *      каскад "No Seal for Sand" / "No Pass for Mate".
	 *   2) Фильтр лендов на apply_parts вырезал чужие ленды из state, но ссылки
	 *      на них оставались в графе (home_link, peers из Seed) — зависание.
	 *   3) Обёртка WebSocket (бывший блок B) глушила соединения к хосту вне
	 *      allow-list — вместе с ними переставали приходить gift/pass чужих
	 *      лордов через собственного мастера, и "No Pass for Lord" возникал
	 *      уже на живом канале. Блок B удалён полностью.
	 * Здесь ничего из данных не вырезается и сокеты не подменяются.
	 *
	 * Точки вмешательства:
	 *   A) $giper_baza_yard.masters() — список целей синхронизации (yard.ts:39):
	 *      ярд сам никогда не стучится к bazа-ru / cmyser из Seed.
	 *   C) Мягкая верификация — единственный допустимый «патч чтения»: отсутствие
	 *      pass у чужих лордов больше не роняет UI с "No Pass for Lord".
	 */

	const local = typeof location !== 'undefined'
		&& /^(localhost|127\.0\.0\.1|\[::1\])$/.test( location.hostname )

	const self_origin = typeof location !== 'undefined' ? location.origin + '/' : ''

	const custom = $mol_state_arg.value( 'zod' )
	const master = custom ?? ( local ? 'http://localhost:9090/' : self_origin )

	// --- A) Allow-list мастеров: только свой узел. Чужих адресов из Seed
	// (masters_seeded) больше ни для чего не используем.
	$giper_baza_yard.masters = (): string[] => [ master ].filter( Boolean )

	// --- C) Мягкая верификация seals чужих лордов.
	// В стоковом протоколе pass лорда приходит ТОЛЬКО внутри gift от него же
	// (land.ts:648-650). Если gift ещё не дошёл (или пришёл запоздало после
	// seal), diff_apply падает с "No Pass for Lord", loading() переигрывает те
	// же units и падает снова — каскад при каждом заходе на stat/glob.
	//
	// Корректная деградация: seal без известного pass НЕ применять (его подписи
	// всё равно некому проверить), но НЕ ронять весь пакет — иначе чужие ленды
	// вычищаются из state, ссылки на них остаются в графе и UI зависает
	// (проверено эмпирически). По хинту самого протокола ("Relax and wait for
	// full peer resync") штатный summ-resync (land.ts:481-497) доведёт граф до
	// целостного состояния сам, когда gift придёт по живому каналу.
	const land_class = $giper_baza_land.prototype as any
	if( land_class.$giper_baza_soft_pass !== true ) {

		land_class.$giper_baza_soft_pass = true

		const lord_pass_base = land_class.lord_pass

		land_class.lord_pass = function( lord: any ) {
			try {
				return lord_pass_base.call( this, lord )
			} catch {
				return null
			}
		}

		const diff_apply_base = land_class.diff_apply

		land_class.diff_apply = function( units: any, skip_load?: any ) {
			try {
				return diff_apply_base.call( this, units, skip_load )
			} catch( error ) {
				const msg = String(( error as Error )?.message ?? error )
				if( !/^No (Pass|Seal) for /.test( msg ) ) throw error
				console.warn( `[baza-autonomy] foreign unit skipped: ${ msg }` )
				return []
			}
		}
	}

}
