namespace $ {

	/**
	 * ЛЁГКАЯ ИЗОЛЯЦИЯ НА УРОВНЕ PWA (без хирургии web.baza)
	 *
	 * Модель: стоковый seed остаётся ЦЕЛИКО — схемы, ленды и даже записи чужих
	 * пиров (baza-ru, cmyser) присутствуют в UI и в Network Monitoring как
	 * косметический дефект. Блокировка чужих серверов делается НАД СОКЕТАМИ:
	 * соединение с адресом, которого нет в нашем allow-list, просто не открывается.
	 *
	 * Почему раньше ломалось:
	 *   1) Фильтр юнитов ВНУТРИ Land.diff_apply рвал пары seal↔pass↔gift —
	 *      каскад "No Seal for Sand" / "No Pass for Mate".
	 *   2) Фильтр лендов на apply_parts вырезал чужие ленды из state, но ссылки
	 *      на них оставались в графе (home_link, peers из Seed) — зависание.
	 * Здесь ничего из данных не вырезается вообще — целостность графа не трогаем.
	 *
	 * Точки вмешательства:
	 *   A) $giper_baza_yard.masters() — список целей синхронизации (yard.ts:39).
	 *   B) window.WebSocket — страховка на сокете (yard.ts:71): «мёртвый» сокет
	 *      к хостам вне allow-list, чтобы трафик наружу не уходил.
	 *   C) Мягкая верификация — единственный допустимый «патч чтения»: отсутствие
	 *      pass у чужих лордов (канал к ним закрыт) больше не роняет UI с
	 *      "No Pass for Lord". Данные НЕ вырезаются — просто непроверяемые seals
	 *      молча не применяются до появления живого peer-resync.
	 */

	const local = typeof location !== 'undefined'
		&& /^(localhost|127\.0\.0\.1|\[::1\])$/.test( location.hostname )

	const self_origin = typeof location !== 'undefined' ? location.origin + '/' : ''

	const custom = $mol_state_arg.value( 'zod' )
	const master = custom ?? ( local ? 'http://localhost:9090/' : self_origin )

	// --- A) Allow-list мастеров: только свой узел. Чужих адресов из Seed
	// (masters_seeded) больше ни для чего не используем.
	$giper_baza_yard.masters = (): string[] => [ master ].filter( Boolean )

	// --- B) Страховка на уровне WebSocket: ни один конструктор не уйдёт к
	// хосту вне allow-list (в т.ч. будущие прямые подключения, если появятся).
	const allowed_hosts = new Set< string >()
	for( const url of [ master, self_origin ] ) {
		try { if( url ) allowed_hosts.add( new URL( url ).host ) } catch {}
	}

	const ws_base = $mol_dom_context.WebSocket
	if(( ws_base as any ).$giper_baza_guarded !== true ) {

		class $giper_baza_ws_guarded extends ws_base {

			static readonly $giper_baza_guarded = true

			constructor( address: string | URL , protocols?: string | string[] ) {

				let blocked = false
				try {
					blocked = !allowed_hosts.has( new URL( String( address ) ).host )
				} catch {}

				// Свой хост — штатное соединение. Чужой — «мёртвый» сокет:
				// открываем его к самому себе (гарантированно живому), чтобы
				// handshake прошёл и yard не зациклился на reconnect, и сразу
				// закрываем — трафик наружу не уходит.
				super( blocked ? self_origin.replace( /^http/, 'ws' ) : address , protocols )

				if( blocked ) {
					console.warn( `[baza-autonomy] socket blocked: ${ address }` )
					const sock = this
					this.addEventListener( 'open', ()=> sock.close() , { once: true } )
				}
			}

		}

		$mol_dom_context.WebSocket = $giper_baza_ws_guarded as any
	}

	// --- C) Мягкая верификация seals чужих лордов.
	// В стоковом протоколе pass лорда приходит ТОЛЬКО внутри gift от него же
	// (land.ts:648-650). Канал к чужим пирам закрыт => их seals/sands есть в
	// state, а их pass нет => diff_apply падает с "No Pass for Lord" (585),
	// loading() переигрывает те же units и падает снова — каскад при каждом
	// заходе на stat/glob. Живой handshake офлайн невозможен: приватных ключей
	// пиров у нас нет, поддельный [pass+gift] не прошёл бы verify().
	//
	// Корректная деградация: seal без известного pass НЕ применять (его подписи
	// всё равно некому проверить), но НЕ ронять весь пакет — иначе чужие ленды
	// вычищаются из state, ссылки на них остаются в графе и UI зависает
	// (проверено эмпирически). По хинту самого протокола ("Relax and wait for
	// full peer resync") при появлении живого канала штатный summ-resync
	// (land.ts:481-497) доведёт граф до целостного состояния сам.
	const land_class = $giper_baza_land.prototype as any
	if( land_class.$giper_baza_soft_pass !== true ) {

		land_class.$giper_baza_soft_pass = true

		const lord_pass_base = land_class.lord_pass

		land_class.lord_pass = function( lord: $giper_baza_link ) {
			try {
				return lord_pass_base.call( this, lord )
			} catch {
				return null
			}
		}

		const diff_apply_base = land_class.diff_apply

		land_class.diff_apply = function(
			units: readonly $giper_baza_unit[],
			skip_load?: 'skip_load',
		) {
			try {
				return diff_apply_base.call( this, units, skip_load )
			} catch( error ) {
				const msg = String(( error as Error )?.message ?? error )
				if( !/^No (Pass|Seal) for /.test( msg ) ) throw error
				this.$.$mol_log3_warn({
					place: `${ this }.diff_apply()`,
					message: msg,
					hint: 'Foreign units skipped. Data kept. Wait for full peer resync.',
					units: units.length,
				})
				return []
			}
		}
	}

}

}
