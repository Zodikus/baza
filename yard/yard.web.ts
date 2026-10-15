namespace $ {

	/**
	 * ЛЁГКАЯ ИЗОЛЯЦИЯ НА УРОВНЕ PWA (без хирургии web.baza)
	 *
	 *   A) masters() = только свой узел — ярд сам не стучится к пирам из Seed.
	 *      #!zod= остаётся приоритетным ручным переключателем.
	 *   B) Мягкая деградация ЧИСТОГО пропуска seal без pass (land.ts:585):
	 *      юнит молча скипается, ОСТАЛЬНЫЕ юниты того же пакета применяются
	 *      штатно — иначе теряются gift/pass и канал сам себе перекрывает
	 *      возможность резолва (наблюдали 8-14 повторов одного пакета).
	 *   Никаких обёрток WebSocket, никаких фильтров лендов — они и ломали всё.
	 */

	const local = typeof location !== 'undefined'
		&& /^(localhost|127\.0\.0\.1|\[::1\])$/.test( location.hostname )

	const self_origin = typeof location !== 'undefined' ? location.origin + '/' : ''

	const custom = $mol_state_arg.value( 'zod' )
	const master = custom ?? ( local ? 'http://localhost:9090/' : self_origin )

	$giper_baza_yard.masters = (): string[] => [ master ].filter( Boolean )

	const land_class = $giper_baza_land.prototype as any
	if( land_class.$giper_baza_soft_pass !== true ) {

		land_class.$giper_baza_soft_pass = true

		const lord_pass_base = land_class.lord_pass

		// Seal без известного pass: возвращаем null вместо throw — дальше
		// чистый пропуск seal произойдёт по ШТАТНОЙ ветке land.ts:588
		// (`if(!pass) continue`) с корректной инкрементацией cursor.
		land_class.lord_pass = function( lord: any ) {
			try {
				return lord_pass_base.call( this, lord )
			} catch {
				return null
			}
		}

		const diff_apply_base = land_class.diff_apply

		// Страховка: если "No ..." вспухнет на позднем этапе (summ/sand/gift),
		// ронять весь пакет НЕЛЬЗЯ — повторяем вызов в режиме skip_load и
		// ловим конкретный индекс проблемного юнита, вырезая только его.
		land_class.diff_apply = function( units: any, skip_load?: any ) {
			try {
				return diff_apply_base.call( this, units, skip_load )
			} catch( error ) {
				const msg = String(( error as Error )?.message ?? error )
				if( !/^No (Pass|Seal) for /.test( msg ) ) throw error
				console.warn( `[baza-autonomy] retry without one unit: ${ msg }` )
				for( let i = 0; i < units.length; ++i ) {
					try {
						return diff_apply_base.call( this, units.filter( (_: any, j: number)=> j !== i ), skip_load )
					} catch {}
				}
				console.warn( `[baza-autonomy] whole batch deferred: ${ msg }` )
				return []
			}
		}
	}

}
