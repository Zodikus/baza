namespace $ {

	/**
	 * МАСТЕР СИНХРОНИЗАЦИИ (AUTONOMY PATCH)
	 * 
	 * Цель: Полная изоляция контура.
	 * 1. Глушим штатный поиск пиров из Base Seed (baza-ru, cmyser).
	 * 2. Оставляем только свой локальный узел или origin.
	 */

	const local = typeof location !== 'undefined'
		&& /^(localhost|127\.0\.0\.1|\[::1\])$/.test( location.hostname )

	const default_master = local
		? 'http://localhost:9090/'
		: ( typeof location !== 'undefined' ? location.origin + '/' : '' )

	// Приоритет ручному переключению через URL #!zod=...
	const custom = $mol_state_arg.value( 'zod' )
	const master = custom ?? default_master

	// ПОЛНАЯ ЗАМЕНА функции masters()
	// Теперь база НИКОГДА не спросит у Seed().peers(), откуда берутся чужие адреса.
	$giper_baza_yard.masters = (): string[] => [ master ].filter( Boolean )


	/**
	 * ФИЛЬТР ДАННЫХ (ANTI-CORRUPTION PATCH)
	 * 
	 * Проблема: Даже при ограниченных мастерах, файл web.baza (Seed) может быть 
	 * применен к состоянию ярда. Внутри него лежат юниты, подписанные чужими лордами.
	 * При верификации (diff_apply) браузер падает с ошибкой "No Pass for Lord",
	 * так как не знает паспортов этих чужих лордов.
	 * 
	 * Решение: Перехватываем метод diff_apply у каждого ленда.
	 * Пропускаем дальше ТОЛЬКО те юниты, чей владелец (lord):
	 *   1. Совпадает с владельцем самого ленда (системные метаданные).
	 *   2. Совпадает с текущим пользователем (наши данные).
	 * Все остальные (чужие пиры из сида) молча отбрасываются ДО проверки подписи.
	 */

	const land_base = $giper_baza_glob.Land
	
	$giper_baza_glob.Land = ( link: $giper_baza_link )=> {
		const land = land_base.call( $giper_baza_glob, link )
		
		// Сохраняем оригинальный метод
		const original_diff_apply = land.diff_apply.bind( land )
		
		// Переопределяем его фильтром
		land.diff_apply = ( units: readonly $giper_baza_unit[], skip_load?: 'skip_load' )=> {
			
			// ID владельца текущего ленда
			const lord_self = land.link().lord().str
			
			// ID нашего текущего пользователя (если авторизован)
			let lord_user_str = ''
			try {
				lord_user_str = $giper_baza_auth.current().pass().lord().str
			} catch {
				// Если пользователь еще не залогинен или ключа нет, считаем, что мы никого не знаем
				lord_user_str = '' 
			}

			// Фильтруем массив юнитов перед передачей в оригинальную функцию
			return original_diff_apply( 
				units.filter( unit => {
					const unit_lord = unit.lord().str
					
					// Разрешаем, если это системный юнит ленда ИЛИ наш личный юнит
					if( unit_lord === lord_self ) return true
					if( lord_user_str && unit_lord === lord_user_str ) return true
					
					// Чужой юнит (например, peer из baza-ru) -> ОТБРАСЫВАЕМ
					return false
				}), 
				skip_load 
			)
		}
		
		return land
	}

}
