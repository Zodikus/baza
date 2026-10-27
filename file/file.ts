namespace $ {

	export const $giper_baza_file_csp = [
		'Content-Security-Policy',
		"sandbox; default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; media-src data:; form-action 'none'",
	] as const
	
	export const $giper_baza_file_query = $hyoo_harp_scheme({
		BAZA: $hyoo_harp_scheme({}),
		file: $hyoo_harp_scheme( {}, $mol_data_string ),
	})

	export class $giper_baza_file extends $giper_baza_dict.with( {
		/** File name */
		Name: $giper_baza_atom_text,
		/** File Content-Type */
		Type: $giper_baza_atom_text,
		/** File content in chunks - list of binaries */
		Chunks: $giper_baza_list_bin,
	}) {
		
		/** Persistent URI to file content */
		@ $mol_mem
		uri() {
			const time = this.last_change()?.valueOf() ?? 0
			return `${ this.name() }?BAZA:file=${ this.link() };time=${ time }`
		}
		
		/** File name */
		name( next?: string | null ) {
			
			const name = this.Name( next )?.val( next )
			if( name ) return name.replaceAll( /(\/|\.\.|:)/g, '_' )
			
			const ext = $mol_file_extensions_mime[ this.type() ] ?? 'bin'
			return `${ this.link() }.${ ext }`
			
		}
		
		/** Mime type */
		type( next?: string | null ) {
			return this.Type( next )?.val( next ) ?? 'application/octet-stream'
		}
		
		/** Blob, File etc. */
		blob( next?: $mol_blob ): $mol_blob {
			
			if( !next ) return new $mol_blob( this.chunks(), { type: this.type() } )
			
			const buffer = new Uint8Array( $mol_wire_sync( next ).arrayBuffer() )
			
			this.buffer( buffer )
			this.type( next.type )
			if( next instanceof $mol_dom_context.File ) this.name( next.name )
			
			return next
		}
		
		/** Solid byte buffer. */
		buffer( next?: Uint8Array< ArrayBuffer > ) {
			
			if( next ) {
				
				const chunks = [] as Uint8Array< ArrayBuffer >[]
				
				for( let offset = 0; offset < next.byteLength; ) {
					chunks.push( next.slice( offset, offset += 2**15 ) ) // split by 32 KB
				}
				
				this.chunks( chunks )
				
				return next
				
			} else {
				
				const chunks = this.chunks()
				const size = chunks.reduce( ( sum, chunk )=> sum + chunk.byteLength, 0 )
				const res = new Uint8Array( size )
				
				let offset = 0
				for( const chunk of chunks ) {
					res.set( chunk, offset )
					offset += chunk.byteLength
				}
				
				return res
				
			}
			
		}
		
		chunks( next?: readonly Uint8Array< ArrayBuffer >[] ) {
			return ( this.Chunks( next )?.items( next )?.filter( $mol_guard_defined ) ?? [] ) as  Uint8Array< ArrayBuffer >[]
		}
		
		str( next?: string, type = 'text/plain' ) {
			
			if( next === undefined ) return $mol_charset_decode( this.buffer() )
				
			this.buffer( $mol_charset_encode( next ) )
			this.type( type )
			
			return next
		}
		
		json( next?: any, type = 'application/json' ) {
			
			if( next === undefined ) return JSON.parse( this.str() )
				
			this.str( JSON.stringify( next ), type )
			
			return next
		}
		
	}
}
