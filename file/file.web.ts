namespace $ {
	
	if( typeof window === 'undefined' ) {
		
		self.addEventListener( 'fetch' , ( event: any )=> {

			const url = new URL( event.request.url )
			try {
				var query = $giper_baza_file_query.parse( url.search )
			} catch { return }
			
			const id = query.file['=']?.[0][0]
			if( !id ) return
			
			const link = $giper_baza_link.check( id )
			if( !link ) return event.respondWith( new Response( null, { status: 400 } ) )

			const file = $.$giper_baza_glob.Pawn( link, $giper_baza_file )
			
			return event.respondWith( $mol_wire_async( file ).blob().then( blob => {
				
				return new Response( blob, {
					status: file.filled() ? 200 : 404,
					statusText: file.filled() ? 'OK' : 'Not Filled',
					headers: {
						'Content-Type': file.type(),
						'X-Content-Type-Options': 'nosniff',
						'X-Powered-By': '$giper_baza_file',
						... Object.fromEntries([ $giper_baza_file_csp ]),
					},
				} )
				
			} ) )
			
		} )
		
	}
	
}
