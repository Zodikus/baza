namespace $ {

	/**
	 * ЛЁГКАЯ ИЗОЛЯЦИЯ НА УРОВНЕ PWA (без хирургии web.baza)
	 *
	 * Модель: стоковый seed остаётся ЦЕЛИКО — схемы, ленды и даже записи чужих
	 * пиров (baza-ru, cmyser) присутствуют в UI и в Network Monitoring как
	 * косметический дефект. Блокировка чужих серверов делается НАД СОКЕТАМИ:
	 * соединение с адресом, которого нет в нашем allow-list, просто не открывается.
	 *
	 * Почему раньше ломалось:
	 *   1) Фильтр юнитов ВНУТРИ Land.diff_apply рвал пары seal↔pass↔gift —
	 *      каскад "No Seal for Sand" / "No Pass for Mate".
	 *   2) Фильтр лендов на apply_parts вырезал чужие ленды из state, но ссылки
	 *      на них оставались в графе (home_link, peers из Seed) — зависание.
	 * Здесь ничего из данных не вырезается вообще — целостность графа не трогаем.
	 *
	 * Точки вмешательства:
	 *   A) $giper_baza_yard.masters() — список целей синхронизации (yard.ts:39).
	 *   B) window.WebSocket — страховка на сокете (yard.ts:71): закрывает сокет
	 *      до onopen, если хост не в allow-list.
	 */

	const local = typeof location !== 'undefined'
		&& /^(localhost|127\.0\.0\.1|\[::1\])$/.test( location.hostname )

	const self_origin = typeof location !== 'undefined' ? location.origin + '/' : ''

	const custom = $mol_state_arg.value( 'zod' )
	const master = custom ?? ( local ? 'http://localhost:9090/' : self_origin )

	// --- A) Allow-list мастеров: только свой узел. Чужих адресов из Seed
	// (masters_seeded) больше ни для чего не используем.
	$giper_baza_yard.masters = (): string[] => [ master ].filter( Boolean )

	// --- B) Страховка на уровне WebSocket: ни один конструктор не уйдёт к
	// хосту вне allow-list (в т.ч. будущие прямые подключения, если появятся).
	const allowed_hosts = new Set< string >()
	for( const url of [ master, self_origin ] ) {
		try { if( url ) allowed_hosts.add( new URL( url ).host ) } catch {}
	}

	const ws_base = $mol_dom_context.WebSocket
	if(( ws_base as any ).$giper_baza_guarded !== true ) {

		class $giper_baza_ws_guarded extends ws_base {

			static readonly $giper_baza_guarded = true

			constructor( address: string | URL , protocols?: string | string[] ) {

				let blocked = false
				try {
					blocked = !allowed_hosts.has( new URL( String( address ) ).host )
				} catch {}

				// Свой хост — штатное соединение. Чужой — «мёртвый» сокет:
				// открываем его к самому себе (гарантированно живому), чтобы
				// handshake прошёл и yard не зациклился на reconnect, и сразу
				// закрываем — трафик наружу не уходит.
				super( blocked ? self_origin.replace( /^http/, 'ws' ) : address , protocols )

				if( blocked ) {
					console.warn( `[baza-autonomy] socket blocked: ${ address }` )
					const sock = this
					this.addEventListener( 'open', ()=> sock.close() , { once: true } )
				}
			}

		}

		$mol_dom_context.WebSocket = $giper_baza_ws_guarded as any
	}

}
