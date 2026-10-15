namespace $ {

	/**
	 * Мастер синхронизации (Autonomy Patch):
	 *   - `#!zod=https%3A%2F%2F<domen>%2F` — приоритет (ручное переключение)
	 *   - localhost → локальный узел :9090
	 *   - иначе → свой origin (location.origin)
	 *
	 * Полная замена глушит штатный masters(), а с ним и masters_seeded()
	 * с пирами из бандленного сида (baza-ru, cmyser).
	 */

	const local = typeof location !== 'undefined'
		&& /^(localhost|127\.0\.0\.1|\[::1\])$/.test( location.hostname )

	const default_master = local
		? 'http://localhost:9090/'
		: ( typeof location !== 'undefined' ? location.origin + '/' : '' )

	const custom = $mol_state_arg.value( 'zod' )
	const master = custom ?? default_master

	// masters_default уже пуст по умолчанию ([] в yard.ts) — чистка не нужна.
	// Полная замена masters() глушит и masters_seeded() с пирами из бандленного сида.
	$giper_baza_yard.masters = (): string[] => [ master ].filter( Boolean )

}
