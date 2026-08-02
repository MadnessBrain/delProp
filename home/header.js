(() => {
	window.delProp = window.delProp || {};

	async function addHeaderBar(workTimerField, user) {
		if (document.getElementById('delprop-header-bar')) return;

		const loginTime = window.delProp.user_input;
		const fio = user?.fio || 'Пользователь';

		const { latenessMin, exitTimeStr: exitTime } = window.delProp.helpers.getWorkDayBounds(
			workTimerField.startDay,
			workTimerField.endDay,
			workTimerField.endDayF,
			loginTime
		);

		const headerBar = document.createElement('div');
		headerBar.id = 'delprop-header-bar';
		headerBar.className = 'delprop-header-bar';

		const triggerBtn = document.createElement('div');
		triggerBtn.id = 'delprop-header-trigger';
		triggerBtn.className = 'delprop-header-trigger hidden';
		triggerBtn.textContent = '▼';

		// Get initial minimized state
		const store = await new Promise(res => chrome.storage.local.get('headerMinimized', res));
		const isMinimized = store.headerMinimized === 'true';

		if (isMinimized) {
			headerBar.classList.add('minimized');
			triggerBtn.classList.remove('hidden');
		}

		headerBar.title = 'Кликните, чтобы скрыть панель';
		headerBar.style.cursor = 'pointer';

		const userIcon = workTimerField.userIcon || '👤';

		headerBar.innerHTML = `
			<div class="delprop-header-content">
				<div class="header-left">
					<span class="header-icon">${userIcon}</span>
					<span class="header-username">${fio}</span>
				</div>
				<div class="header-center">
					<span class="header-arrival">🌅 Вход: <strong>${loginTime ? loginTime.substring(0, 5) : '--:--'}</strong></span>
					${latenessMin > 0 ? `<span class="header-lateness">⚠️ Опоздание: <strong>${window.delProp.helpers.formatLateness(latenessMin)}</strong></span>` : ''}
					<span class="header-lateness header-exit">На выход в: <strong>${exitTime}</strong></span>	
				</div>
				<div class="header-right">
					<div class="header-progress-container">
						<div class="header-progress-bar" id="header-progress-bar"></div>
						<span class="header-progress-text" id="header-progress-text">0%</span>
					</div>
				</div>
			</div>
		`;

		document.body.appendChild(headerBar);
		document.body.appendChild(triggerBtn);

		const minimize = () => {
			headerBar.classList.add('minimized');
			setTimeout(() => {
				triggerBtn.classList.remove('hidden');
			}, 300);
			chrome.storage.local.set({ headerMinimized: 'true' });
		};

		const expand = () => {
			triggerBtn.classList.add('hidden');
			headerBar.classList.remove('minimized');
			chrome.storage.local.set({ headerMinimized: 'false' });
		};

		headerBar.addEventListener('click', minimize);
		triggerBtn.addEventListener('click', expand);

		// Start progress tracking loop
		startHeaderProgress(workTimerField);
	}

	function startHeaderProgress(workTimerField) {
		const progressBar = document.getElementById('header-progress-bar');
		const progressText = document.getElementById('header-progress-text');
		if (!progressBar || !progressText) return;

		const dayOfWeek = new Date().getDay();
		if (dayOfWeek === 6 || dayOfWeek === 0) {
			progressBar.style.width = '100%';
			progressText.textContent = '100%';
			return;
		}

		const { startWork, endWork } = window.delProp.helpers.getWorkDayBounds(
			workTimerField.startDay,
			workTimerField.endDay,
			workTimerField.endDayF,
			window.delProp.user_input,
			dayOfWeek
		);

		function update() {
			const { percent, delay } = window.delProp.helpers.getPerDay(startWork, endWork);
			progressBar.style.width = `${percent}%`;
			progressText.textContent = `${percent}%`;
			if (percent < 100) {
				setTimeout(update, delay);
			}
		}
		update();
	}

	function initHeader() {
		if (window.self !== window.top) return;

		const formFields = window.delProp.settings;
		const user = window.delProp.user;
		if (!formFields || !formFields.workTimerField) return;

		const { headerEnabled } = formFields.workTimerField;
		if (headerEnabled === 'true') {
			if (!document.body) return;
			addHeaderBar(formFields.workTimerField, user);
		}
	}

	window.delProp.onCoreReady(initHeader);
})();
