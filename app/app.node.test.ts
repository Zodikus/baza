namespace $.$$ {
	$mol_test({

		'GET ?BAZA:file=<id> serves file from glob'( $ ) {

			const land = $.$giper_baza_glob.home().land()
			const file = land.Pawn( $giper_baza_file ).Head( new $giper_baza_link( '11111111' ) )

			const content = $mol_charset_encode( '# Hello' )
			file.buffer( content )
			file.type( 'text/markdown' )

			const app = $giper_baza_app_node.make({ $ })

			const res = [] as any[]

			app.GET( $mol_rest_message.make({
				method: ()=> 'GET',
				uri: ()=> new URL( `http://baza.giper.dev/hello.md?BAZA:file=${ file.link().str }` ),
				port: $mol_rest_port.make({
					send_code: code => res.push( code ),
					send_type: type => res.push( type ),
					send_prop: ( name, value ) => res.push([ name, value ]),
					send_bin: bin => res.push( bin ),
				}),
			}) )

			$mol_assert_equal( res, [
				200,
				$giper_baza_file_csp,
				'text/markdown',
				content,
			] )

		},
		
		'GET ?BAZA:file=<unknown> returns 404'( $ ) {

			const link = new $giper_baza_link( '99999999_99999999' )

			const app = $giper_baza_app_node.make({ $ })

			const res = [] as any[]

			app.GET( $mol_rest_message.make({
				method: ()=> 'GET',
				uri: ()=> new URL( `http://baza.giper.dev/ghost.md?BAZA:file=${ link.str }` ),
				port: $mol_rest_port.make({
					send_code: code => res.push( code ),
					send_type: type => res.push( type ),
					send_bin: bin => res.push( bin ),
				}),
			}) )

			$mol_assert_equal( res, [ 404, 'application/octet-stream', new Uint8Array ] )

		},

		async 'GET encrypted Land file returns 403 without content'( $ ) {

			const land = $.$giper_baza_glob.home().land()
			await $mol_wire_async( land ).encrypted( true )

			const file = land.Pawn( $giper_baza_file ).Head( new $giper_baza_link( '11111111' ) )
			file.buffer( $mol_charset_encode( 'secret' ) )

			const app = $giper_baza_app_node.make({ $ })
			const res = [] as any[]

			app.GET( $mol_rest_message.make({
				method: ()=> 'GET',
				uri: ()=> new URL( `http://baza.giper.dev/secret.bin?BAZA:file=${ file.link().str }` ),
				port: $mol_rest_port.make({
					send_code: code => res.push( code ),
					send_type: type => res.push( type ),
					send_bin: bin => res.push( bin ),
				}),
			}) )

			$mol_assert_equal( res, [ 403 ] )

		},

	})
}
