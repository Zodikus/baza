namespace $ {
	
	/**
	 * Мастер синхронизации:
	 *   -`#!zod=https%3A%2F%2F<domen>%2F` — приоритет (ручное переключение)
	 *   - localhost → локальный узел :9090
	 *   - иначе → свой origin (location.origin)
	 *
	 * Полная замена — глушим штатный masters() и обнуляем default.
	 */
	
	const local = typeof location !== 'undefined' 
		&& /^(localhost|127\.0\.0\.1|\[::1\])$/.test( location.hostname )
	
	const default_master = local 
		? 'http://localhost:9090/' 
		: ( typeof location !== 'undefined' ? location.origin + '/' : '' )
	
	const custom = $mol_state_arg.value( 'zod' )
	const master = custom || default_master
	
	$giper_baza_yard.masters_default.length = 0
	$giper_baza_yard.masters = (): string[] => [ master ]
	
}
