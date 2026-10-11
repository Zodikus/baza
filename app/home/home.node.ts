namespace $ {
	
	export class $giper_baza_app_home_node extends $giper_baza_app_home {
		
		@ $mol_mem
		init() {
			
			console.log( '[DEBUG] init: START' )
			
			super.init()
			
			console.log( '[DEBUG] init: super.init() OK' )
			console.log( '[DEBUG] init: GIPER_BAZA_ADMIN =', process.env.GIPER_BAZA_ADMIN )
			console.log( '[DEBUG] init: length =', process.env.GIPER_BAZA_ADMIN?.length )
			
			if( process.env.GIPER_BAZA_ADMIN ) {
				try {
					const pass = $giper_baza_auth_pass.from( process.env.GIPER_BAZA_ADMIN )
					console.log( '[DEBUG] init: pass parsed, byteLength =', pass.byteLength )
					
					const land = this.land()
					console.log( '[DEBUG] init: land =', land?.link?.()?.str )
					
					land.give( pass, $giper_baza_rank_rule )
					console.log( '[DEBUG] init: give() OK' )
				} catch( e ) {
					console.error( '[DEBUG] init: ERROR =', e )
				}
			} else {
				console.log( '[DEBUG] init: GIPER_BAZA_ADMIN not set' )
			}
			
			const host = process.env.GIPER_BAZA_DOMAIN || $node.os.hostname()
			
			this.name( host.replace( /\.ip\..*$/, '' ) )
			this.urls([ `https://${host}/` ])
			
			console.log( '[DEBUG] init: END' )
		}
		
	}
	
	$.$giper_baza_app_home = $giper_baza_app_home_node
	
}
