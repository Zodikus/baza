namespace $ {
	
	// Очистить вшитый список
	$giper_baza_yard.masters_default.length = 0
	
	// Свой сервер (или #!zod=)
	const custom = $mol_state_arg.value( 'zod' )
		?? ( $mol_dom.document ? $mol_dom.document.location.origin + '/' : '' )
	
	if( custom ) {
		$giper_baza_yard.masters_default.push( custom )
	}
	
	// masters() возвращает ЭТОТ список (не пустой)
	$giper_baza_yard.masters = (): string[] => $giper_baza_yard.masters_default
	
}
