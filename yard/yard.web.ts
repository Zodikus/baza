namespace $ {
	
	$giper_baza_yard.masters_default.length = 0
	$giper_baza_yard.masters = (): string[] => []
	
	const custom = $mol_state_arg.value( 'zod' )
		?? ( $mol_dom.document ? $mol_dom.document.location.origin + '/' : '' )
	
	if( custom ) {
		$giper_baza_yard.masters_default.unshift( custom )
	}
	
}
