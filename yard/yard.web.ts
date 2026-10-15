namespace $ {

	/**
	 * Мастер синхронизации:
	 *   - `#!zod=https%3A%2F%2F<domen>%2F` — приоритет (ручное переключение)
	 *   - localhost → локальный узел :9090
	 *   - иначе → свой origin (location.origin)
	 */

	const local = typeof location !== 'undefined'
		&& /^(localhost|127\.0\.0\.1|\[::1\])$/.test( location.hostname )

	const default_master = local
		? 'http://localhost:9090/'
		: ( typeof location !== 'undefined' ? location.origin + '/' : '' )

	const custom = $mol_state_arg.value( 'zod' )
	const master = custom ?? default_master

	$giper_baza_yard.masters = (): string[] => [ master ].filter( Boolean )

	/**
	 * Защита от "No Pass for Lord" / "No Seal for Sand" / "No Pass for Mate".
	 * Отсечение на уровне ЛЕНДОВ, а не юнитов (см. разбор логов ниже).
	 */

	const apply_parts_base = $giper_baza_glob.apply_parts.bind( $giper_baza_glob )

	// Лорды, чьи ленды применяются всегда: системный deck-ленд и ленд текущего
	// пользователя. Формат link'а: `<peer>_<lord>[_<area>...]`, лорд = первые два
	// сегмента (link.lord() = split('_').slice(0,2), link.land() = slice(0,3)).
	const own_lords = new Set< string >([
		$giper_baza_flex_deck_link.str.split( '_' ).slice( 0, 2 ).join( '_' ),
	])

	try {
		own_lords.add( $giper_baza_auth.current().pass().lord().str )
	} catch { /* авторизация ещё не готова */ }

	$giper_baza_glob.apply_parts = ( parts: $giper_baza_pack_parts )=> {

		const filtered = parts.filter(([ land_id ])=> {
			const lord = land_id.split( '_' ).slice( 0, 2 ).join( '_' )
			if( own_lords.has( lord ) ) return true
			console.warn( `[baza] foreign land skipped: ${ land_id }` )
			return false
		})

		return apply_parts_base( filtered )
	}

}
