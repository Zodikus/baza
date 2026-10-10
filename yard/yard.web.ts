namespace $ {
	if( $mol_dom.document ) $giper_baza_yard.masters_default.push( $mol_dom.document.location.origin + '/' )

	const orig = $giper_baza_yard.masters_override.bind( $giper_baza_yard )
	$giper_baza_yard.masters_override = () => orig() ?? [ $mol_dom.document.location.origin + '/' ]
}
