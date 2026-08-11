// home/pivo/core.js
// Timer engine: state management, vacation logic, notification flow and DOM updates.
// Composes with messages.js, render.js, and themes.js via window.delProp.pivo namespace.
window.delProp = window.delProp || {};
window.delProp.pivo = window.delProp.pivo || {};

(function() {
	const msg = window.delProp.pivo.messages;
	const getRenderer = window.delProp.pivo.getRenderer;

	// State container — single mutable object so helper functions can share it
	const state = {
		bubblesInit: false,
		activeTimeouts: [],
		changeWrapperTimer: null,
		changeNotificator: null,
		workTimerField: null,
		user: null,
		theme: 'beer',
		startWork: 0,
		endWork: 0,
		hasBubbles() { return this.bubblesInit; },
		drawBubbles(count, wrapper) { drawBubbles(count, wrapper); }
	};

	function getShadowRoot() {
		const host = document.getElementById('pivo');
		return host ? host.shadowRoot : null;
	}

	function toNorm(num) { return num >= 0 && num < 10 ? `0${num}` : num.toString(); }
	function toNormMs(num) {
		if (num >= 10 && num < 100) return `0${num}`;
		if (num >= 0 && num < 10) return `00${num}`;
		return num.toString();
	}

	function drawBubbles(count, wrapper) {
		for (let i = 0; i < count; i++) {
			const top = Math.floor(Math.random() * 95 + 1);
			const left = Math.floor(Math.random() * 95 + 1);
			const duration = Math.floor(Math.random() * 11 + 4);
			const scale = Math.random() * 0.8 + 0.2;

			const div = document.createElement('div');
			const span = document.createElement('span');
			span.className = "dot";
			div.style.cssText = `
				top: ${top}%;
				left: ${left}%;
				scale: ${scale.toFixed(1)};
				animation: animate ${duration}s linear infinite;`;
			div.append(span);
			wrapper.append(div);
		}
		state.bubblesInit = true;
	}

	function clearNotifications() {
		state.activeTimeouts.forEach(t => { clearTimeout(t); clearInterval(t); });
		state.activeTimeouts = [];
		const root = getShadowRoot();
		if (root) {
			const notDiv = root.querySelector('.not');
			if (notDiv) notDiv.textContent = '';
		}
	}

	function tapText(text) {
		clearNotifications();
		const root = getShadowRoot();
		if (!root) return;
		const notDiv = root.querySelector('.not');
		if (!notDiv) return;

		text.split('').forEach((letter, idx) => {
			const t = setTimeout(() => {
				notDiv.append(letter);
			}, idx * 200);
			state.activeTimeouts.push(t);
		});
	}

	function notifications(data) {
		clearNotifications();
		const root = getShadowRoot();
		if (!root) return Promise.resolve('200');
		const notDiv = root.querySelector('.not');
		if (!notDiv) return Promise.resolve('200');

		return new Promise((resolve) => {
			if (Array.isArray(data)) {
				let counter = 0;
				function showNext() {
					if (counter >= data.length) { resolve('200'); return; }
					notDiv.textContent = data[counter];
					counter++;
					const t = setTimeout(() => {
						notDiv.textContent = '';
						showNext();
					}, 2000);
					state.activeTimeouts.push(t);
				}
				showNext();
			} else {
				notDiv.textContent = data;
				const t = setTimeout(() => {
					notDiv.textContent = '';
					resolve('200');
				}, 2000);
				state.activeTimeouts.push(t);
			}
		});
	}

	function timer(end) {
		return new Promise((resolve) => {
			const root = getShadowRoot();
			if (!root) { resolve('200'); return; }
			const timerEl = root.querySelector('.timer');
			if (!timerEl) { resolve('200'); return; }

			if (timerEl.classList.contains('hidden')) {
				timerEl.classList.remove('hidden');
				const hours = root.querySelector('#h'),
					minutes = root.querySelector('#min'),
					seconds = root.querySelector('#sec'),
					mseconds = root.querySelector('#ms');
				const hideElem = (el, val) => { el.classList.toggle('hidden', val === 0); };
				let t = setTimeout(changeTimer);

				function changeTimer() {
					const r = end - Date.now();
					let h = Math.floor((r / (1000 * 60 * 60)) % 24),
						m = Math.floor((r / 1000 / 60) % 60),
						s = Math.floor((r / 1000) % 60),
						ms = Math.floor(r % 1000);

					if (s > 0 && h > 0) { m++; }
					if (m === 60) { h++; m = 0; }

					hideElem(hours, h);
					if (h == 0) { hideElem(minutes, m); }
					if (m == 0) { hideElem(seconds, s); }

					hours.textContent = toNorm(h);
					minutes.textContent = toNorm(m);
					seconds.textContent = toNorm(s);
					mseconds.textContent = toNormMs(ms);

					if (h > 0) {
						seconds.classList.add('hidden');
						mseconds.classList.add('hidden');
						minutes.classList.add('ha');
						s > 0 ? t = setTimeout(changeTimer, s * 1000) : t = setTimeout(changeTimer, 60000);
					} else if (m > 0) {
						mseconds.classList.add('hidden');
						minutes.classList.remove('ha');
						seconds.classList.remove('hidden');
						seconds.classList.add('ha');
						t = setTimeout(changeTimer, 1000);
					} else {
						mseconds.classList.remove('hidden');
						seconds.classList.remove('ha');
						t = setTimeout(changeTimer, 33);
					}

					if (r <= 0) {
						clearTimeout(t);
						timerEl.classList.add('hidden');
						for (let c of timerEl.children) { c.classList.remove('hidden'); }
						resolve('200');
					}
				}
			} else {
				resolve('200');
			}
		});
	}

	function getTimeOutWork() {
		return [
			{ start: window.delProp.helpers.timeNorm('10:00'), end: window.delProp.helpers.timeNorm('10:15'), name: 'Первый перекур' },
			{ start: window.delProp.helpers.timeNorm('11:45'), end: window.delProp.helpers.timeNorm('12:30'), name: 'ОБЕД' },
			{ start: window.delProp.helpers.timeNorm('14:30'), end: window.delProp.helpers.timeNorm('14:45'), name: 'Второй перекур' }
		];
	}

	function notificator() {
		const now = Date.now();
		const root = getShadowRoot();
		if (!root) return;
		const notDiv = root.querySelector('.not');
		if (!notDiv) return;

		const leh = state.user?.fio === 'Малышев Алексей Юрьевич';
		if (leh && now > window.delProp.helpers.timeNorm('11:30') && now < window.delProp.helpers.timeNorm('11:45')) {
			const period = 30000;
			const count = Math.floor((window.delProp.helpers.timeNorm('11:45') - now) / period);
			for (let i = 0; i < count; i++) {
				const t = setTimeout(() => { tapText('ЛЁХ, 45!'); }, i * period);
				state.activeTimeouts.push(t);
			}
		}

		if (new Date().getDay() === 0) {
			const text = '...................';
			tapText(text);
			const sundayT = setInterval(() => { tapText(text); }, text.length * 200 + 1000);
			state.activeTimeouts.push(sundayT);
			timer(state.startWork).then(() => clearNotifications());
			return;
		}

		if (now < state.startWork) {
			notifications(msg.msg.morning).then(() => timer(state.startWork)).then(() => notificator());
		} else if (now < state.endWork) {
			let min = [], max = [];
			for (const a of getTimeOutWork()) {
				if (now < a.start) { min.push(a.start); }
				max.push(a.end);

				if (now > a.start && now < a.end) {
					tapText(a.name);
					const textt = setInterval(() => tapText(a.name), a.name.length * 200 + 1000);
					state.activeTimeouts.push(textt);
					let endVal = a.end;
					if (state.endWork < a.end) { endVal = state.endWork; }
					timer(endVal).then(() => {
						clearNotifications();
						if (endVal != state.endWork) return notifications(msg.msg.stop);
					}).then(notificator);
				}
			}

			if (now < Math.max.apply(null, max)) {
				tapText(msg.msg.work);
				timer(Math.min.apply(null, min)).then(() => {
					clearNotifications();
					return notifications(msg.msg.start);
				}).then(notificator);
			} else {
				tapText(msg.msg.work);
				timer(state.endWork).then(notificator);
			}
		} else {
			const maxOvertime = window.delProp.helpers.timeNorm('19:00');
			if (now < maxOvertime) {
				tapText('Идет переработка');
				timer(maxOvertime).then(notificator);
			} else {
				notifications(window.delProp.pivo.getFinishMsg(state.theme));
			}
		}
	}

	function changeWrapper() {
		const { percent, delay } = window.delProp.helpers.getPerDay(state.startWork, state.endWork);
		const root = getShadowRoot();
		if (!root) { state.changeWrapperTimer = setTimeout(changeWrapper, delay); return; }
		const wrapper = root.querySelector('.wrapper');
		const percentDiv = root.querySelector('#percent');
		const glass = root.querySelector('.glass');

		const renderer = getRenderer(state.theme);
		renderer({ root, percent, wrapper, percentDiv, glass, state });

		if (percent >= 100) {
			clearTimeout(state.changeWrapperTimer);
			percentDiv.style.animation = "slide 8s ease-in";
			setTimeout(() => {
				notifications(window.delProp.pivo.getFinishMsg(state.theme));
				percentDiv.style.display = 'none';
				glass.style.animation = "cheers 1s linear 10";
			}, 7000);
		} else {
			state.changeWrapperTimer = setTimeout(changeWrapper, delay);
		}
	}

	// Public entry point: called from home/pivo.js after DOM attach
	window.delProp.pivo.start = function({ theme, workTimerField, user }) {
		state.theme = theme;
		state.workTimerField = workTimerField;
		state.user = user;

		const bounds = window.delProp.helpers.getWorkDayBounds(
			workTimerField.startDay, workTimerField.endDay, workTimerField.endDayF,
			window.delProp.user_input, new Date().getDay()
		);

		state.startWork = bounds.startWork;
		state.endWork = bounds.endWork;

		if (new Date().getDay() === 6) {
			const root = getShadowRoot();
			if (!root) return;
			const wrapper = root.querySelector('.wrapper');
			const glass = root.querySelector('.glass');
			if (wrapper) wrapper.style.height = '100%';
			if (wrapper) drawBubbles(100, wrapper);
			notifications(window.delProp.pivo.getSatMsg(theme));
			if (glass) glass.style.animation = "cheers 1s linear 10";
			return;
		}

		if (new Date().getDay() === 0) {
			state.startWork += 24 * 60 * 60 * 1000;
			state.endWork += 24 * 60 * 60 * 1000;
		}

		state.changeWrapperTimer = setTimeout(changeWrapper);
		state.changeNotificator = setTimeout(notificator);
	};
})();
