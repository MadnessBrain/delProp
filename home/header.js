(() => {
	window.delProp = window.delProp || {};

	async function addHeaderBar(workTimerField, user) {
		if (document.getElementById('delprop-header-bar')) return;

		const start = workTimerField.startDay || '07:00';
		const loginTime = window.delProp.user_input;
		const fio = user?.fio || 'Пользователь';

		// Calculate lateness
		let latenessMin = 0;
		if (loginTime) {
			const startMin = window.delProp.helpers.parseTimeToMinutes(start);
			const loginMin = window.delProp.helpers.parseTimeToMinutes(loginTime);
			if (startMin !== null && loginMin !== null && loginMin > startMin) {
				latenessMin = loginMin - startMin;
			}
		}

		const endDay = (new Date().getDay() !== 5 ? workTimerField.endDay : workTimerField.endDayF);
		const [h, min] = endDay.split(':');
		const exitTime = latenessMin <= 30 ? [h, +min + latenessMin].join(':') : endDay;

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

		headerBar.innerHTML = `
			<div class="delprop-header-content">
				<div class="header-left">
					<span class="header-icon">👤</span>
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

		const start = workTimerField.startDay || '07:00';
		const end = workTimerField.endDay || '16:00';
		const endF = workTimerField.endDayF || '14:45';

		let startWork = window.delProp.helpers.timeNorm(start);
		let endWork = window.delProp.helpers.timeNorm(end);

		if (new Date().getDay() === 5) {
			endWork = window.delProp.helpers.timeNorm(endF);
		}

		if (endWork <= startWork) {
			endWork += 24 * 60 * 60 * 1000;
		}

		// Calculate lateness and shift endWork if lateness <= 30 min
		let latenessMin = 0;
		if (window.delProp.user_input) {
			const startMin = window.delProp.helpers.parseTimeToMinutes(start);
			const loginMin = window.delProp.helpers.parseTimeToMinutes(window.delProp.user_input);
			if (startMin !== null && loginMin !== null && loginMin > startMin) {
				latenessMin = loginMin - startMin;
				if (latenessMin > 0 && latenessMin <= 30) {
					endWork += latenessMin * 60 * 1000;
				}
			}
		}

		if (new Date().getDay() === 6 || new Date().getDay() === 0) {
			progressBar.style.width = '100%';
			progressText.textContent = '100%';
			return;
		}

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
