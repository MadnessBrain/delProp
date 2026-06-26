(() => {
	window.delProp = window.delProp || {};

	let bubbles = false;
	const timeOutWork = [
		{ start: window.delProp.helpers.timeNorm('10:00'), end: window.delProp.helpers.timeNorm('10:15'), name: 'Первый перекур' },
		{ start: window.delProp.helpers.timeNorm('14:30'), end: window.delProp.helpers.timeNorm('14:45'), name: 'Второй перекур' },
		{ start: window.delProp.helpers.timeNorm('11:45'), end: window.delProp.helpers.timeNorm('12:30'), name: 'ОБЕД' }
	];

	const msg = {
		work: "😔 Работать:",
		std: ['Суббота же', 'Вот тебе пиво', 'А я домой!'],
		start: ['Ураа..', 'Перерыв'],
		stop: ['Увы..', 'Пора работать'],
		morning: ['Работа еще не началась!', 'Но ты уже тут?', 'Сумасшествие!', 'Ожидайте...']
	};

	function getShadowRoot() {
		const host = document.getElementById('pivo');
		return host ? host.shadowRoot : null;
	}

	function drawBubbles(count, wrapper) {
		for (let i = 0; i < count; i++) {
			let top = Math.floor(Math.random() * 95 + 1),
				left = Math.floor(Math.random() * 95 + 1),
				duration = Math.floor(Math.random() * 11 + 4),
				scale = Math.random() * 0.8 + 0.2;

			const div = document.createElement('div');
			const span = document.createElement('span');

			span.className = "dot";
			div.style.cssText = `
				top: ${top}%;
				left: ${left}%;
				scale: ${scale.toFixed(1)};
				animation: animate ${duration}s linear infinite;    
			`;
			div.append(span);
			wrapper.append(div);
		}
		bubbles = true;
	}

	function toNorm(num) {
		return num >= 0 && num < 10 ? `0${num}` : num.toString();
	}

	function toNormMs(num) {
		if (num >= 10 && num < 100) {
			return `0${num}`;
		} else if (num >= 0 && num < 10) {
			return `00${num}`;
		} else {
			return num.toString();
		}
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

				const hideElem = (elem, elemValue) => {
					elem.classList.toggle('hidden', elemValue === 0);
				};

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
			}
		});
	}

	let activeTimeouts = [];

	function clearNotifications() {
		activeTimeouts.forEach(t => {
			clearTimeout(t);
			clearInterval(t);
		});
		activeTimeouts = [];
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

		text.split('').forEach((letter, id) => {
			const t = setTimeout(() => {
				notDiv.append(letter);
			}, id * 200);
			activeTimeouts.push(t);
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
					if (counter >= data.length) {
						resolve('200');
						return;
					}
					notDiv.textContent = data[counter];
					counter++;
					const t = setTimeout(() => {
						notDiv.textContent = '';
						showNext();
					}, 2000);
					activeTimeouts.push(t);
				}

				showNext();
			} else {
				notDiv.textContent = data;
				const t = setTimeout(() => {
					notDiv.textContent = '';
					resolve('200');
				}, 2000);
				activeTimeouts.push(t);
			}
		});
	}

	function changePivo(workTimerField, user) {
		const root = getShadowRoot();
		if (!root) {
			setTimeout(() => changePivo(workTimerField, user), 50);
			return;
		}
		const percentDiv = root.querySelector('#percent');
		const wrapper = root.querySelector('.wrapper');
		const glass = root.querySelector('.glass');

		if (!percentDiv || !wrapper || !glass) {
			setTimeout(() => changePivo(workTimerField, user), 50);
			return;
		}

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

		if (new Date().getDay() === 6) {
			wrapper.style.height = '100%';
			drawBubbles(100, wrapper);
			notifications(msg.std);
			glass.style.animation = "cheers 1s linear 10";
			return;
		}

		if (new Date().getDay() === 0) {
			startWork = startWork + 24 * 60 * 60 * 1000;
			endWork = endWork + 24 * 60 * 60 * 1000;
		}

		let changeWrapperTimer = setTimeout(changeWrapper);
		let changeNotificator = setTimeout(notificator);

		function notificator() {
			const now = Date.now();
			const root = getShadowRoot();
			if (!root) return;
			const notDiv = root.querySelector('.not');
			if (!notDiv) return;

			const leh = user?.fio === 'Малышев Алексей Юрьевич';

			if (leh && now > window.delProp.helpers.timeNorm('11:30') && now < window.delProp.helpers.timeNorm('11:45')) {
				const period = 30000;
				const count = Math.floor((window.delProp.helpers.timeNorm('11:45') - now) / period);

				for (let i = 0; i < count; i++) {
					const t = setTimeout(() => {
						tapText('ЛЁХ, 45!');
					}, i * period);
					activeTimeouts.push(t);
				}
			}

			if (new Date().getDay() === 0) {
				const text = '...................';
				tapText(text);
				const रविवारT = setInterval(() => {
					tapText(text);
				}, text.length * 200 + 1000);
				activeTimeouts.push(रविवारT);
				timer(startWork).then(() => {
					clearNotifications();
				});
				return;
			}

			if (now < startWork) {
				notifications(msg.morning).then(() => timer(startWork)).then(() => notificator());
			} else if (now < endWork) {
				let min = [];
				let max = [];

				for (const a of timeOutWork) {
					if (now < a.start) { min.push(a.start); }
					max.push(a.end);

					if (now > a.start && now < a.end) {
						tapText(a.name);
						const textt = setInterval(() => tapText(a.name), a.name.length * 200 + 1000);
						activeTimeouts.push(textt);
						let endVal = a.end;

						if (endWork < a.end) { endVal = endWork; }

						timer(endVal)
							.then(() => {
								clearNotifications();
								if (endVal != endWork) {
									return notifications(msg.stop);
								}
							})
							.then(notificator);
					}
				}

				if (now < Math.max.apply(null, max)) {
					tapText(msg.work);
					timer(Math.min.apply(null, min))
						.then(() => {
							clearNotifications();
							return notifications(msg.start);
						})
						.then(notificator);
				} else {
					tapText(msg.work);
					timer(endWork).then(notificator);
				}
			}
		}

		function changeWrapper() {
			const { percent, delay } = window.delProp.helpers.getPerDay(startWork, endWork);

			if (percent <= 0) {
				percentDiv.style.display = 'none';
			} else {
				percentDiv.style.display = 'block';
			}

			if (percent > 63) {
				percentDiv.style.color = '#00000091';
			} else {
				percentDiv.style.color = '#999519';
			}

			wrapper.style.height = `${percent}%`;
			percentDiv.textContent = `${percent}%`;

			const foam = root.querySelector('.foam');
			if (foam) {
				foam.style.display = percent > 3 ? 'block' : 'none';
			}
			glass.classList.toggle('has-beer', percent > 3);

			if (!bubbles && percent > 20 && percent < 50) {
				drawBubbles(40, wrapper);
			} else if (!bubbles && percent >= 50 && percent < 80) {
				drawBubbles(80, wrapper);
			} else if (!bubbles && percent >= 80) {
				drawBubbles(100, wrapper);
			} else if (bubbles) {
				drawBubbles(1, wrapper);
			}

			changeWrapperTimer = setTimeout(changeWrapper, delay);

			if (percent >= 100) {
				clearTimeout(changeWrapperTimer);
				percentDiv.style.animation = "slide 8s ease-in";
				setTimeout(() => {
					notifications(['Пиво налито!', 'Пора домой!!']);
					percentDiv.style.display = 'none';
					glass.style.animation = "cheers 1s linear 10";
				}, 7000);
			}
		}
	}

	async function addPivo() {
		const host = document.createElement('div');
		host.id = 'pivo';
		host.style.cssText = `
			position: fixed;
			bottom: 0;
			right: 6px;
			height: 340px;
			width: 160px;
			display: block;
			z-index: 2147483647;
			pointer-events: none;
		`;

		const shadow = host.attachShadow({ mode: 'open' });
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = chrome.runtime.getURL('home/pivo.css');

		const inner = document.createElement('div');
		inner.innerHTML = `
			<div class="container">
				<div class="glass">
					<div class="handle"></div>
					<div class="glass_container">
						<div class="wrapper">
							<div class="foam"></div>
						</div>
						<div class="glass_grooves">
							<div class="groove"></div>
							<div class="groove"></div>
							<div class="groove"></div>
						</div>
						<span id="percent"></span>
					</div>
				</div>
				<div class="notifications">
					<h2 class="not"></h2>
					<div class="timer hidden">
						<span id="h">00</span>
						<span id="min">00</span>
						<span id="sec">00</span>
						<span id="ms">00</span>
					</div>
				</div>
			</div>
		`;

		shadow.appendChild(link);
		shadow.appendChild(inner);
		document.documentElement.append(host);
	}

	function initPivo() {
		if (window.self !== window.top) return;

		const formFields = window.delProp.settings;
		const user = window.delProp.user;
		if (!formFields || !formFields.workTimerField) return;

		const { timer: timerOpt } = formFields.workTimerField;
		if (timerOpt === 'true') {
			if (!document.body) return;
			addPivo().then(() => {
				changePivo(formFields.workTimerField, user);
			});
		}
	}

	window.delProp.onCoreReady(initPivo);
})();
