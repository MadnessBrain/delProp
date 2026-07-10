// archive/archiveTimer.js

(function() {
	window.initArchiveTimer = function (workTimerField, userInput) {
		if (!workTimerField || document.getElementById('delprop-archive-timer')) return;

		const actvTab = document.querySelector('.dhxtabbar_tab');
		if (!actvTab) return;

		const parent = actvTab.parentNode.parentNode;
		if (!parent) return;

		const timerDiv = document.createElement('div');
		timerDiv.id = 'delprop-archive-timer';
		timerDiv.style.position = 'absolute';
		timerDiv.style.right = '15px';
		timerDiv.style.top = '40%';
		timerDiv.style.transform = 'translateY(-50%)';
		timerDiv.style.fontSize = '11px';
		timerDiv.style.fontFamily = 'Tahoma, Arial, sans-serif';
		timerDiv.style.color = '#333';
		timerDiv.style.zIndex = '999';
		timerDiv.style.pointerEvents = 'none';

		parent.appendChild(timerDiv);

		const helpers = window.delProp.timeHelpers;
		const start = workTimerField.startDay || '07:00';
		let latenessMin = 0;
		if (userInput) {
			const startMin = helpers.parseTimeToMinutes(start);
			const loginMin = helpers.parseTimeToMinutes(userInput);
			if (startMin !== null && loginMin !== null && loginMin > startMin) {
				latenessMin = loginMin - startMin;
			}
		}

		const endDay = (new Date().getDay() !== 5 ? (workTimerField.endDay || '16:00') : (workTimerField.endDayF || '14:45'));

		let exitTime = endDay;
		if (latenessMin > 0 && latenessMin <= 30) {
			const endMin = helpers.parseTimeToMinutes(endDay);
			if (endMin !== null) {
				const finalMin = endMin + latenessMin;
				const fh = String(Math.floor(finalMin / 60)).padStart(2, '0');
				const fm = String(finalMin % 60).padStart(2, '0');
				exitTime = `${fh}:${fm}`;
			}
		}

		const startWork = helpers.timeNorm(start);
		const endWork = helpers.timeNorm(endDay);

		function update() {
			if (new Date().getDay() === 6 || new Date().getDay() === 0) {
				timerDiv.innerHTML = `На выход: <strong>${exitTime}</strong> (100%)`;
				return;
			}
			const { percent, delay } = helpers.getPerDay(startWork, endWork + (latenessMin <= 30 ? latenessMin * 60 * 1000 : 0));
			timerDiv.innerHTML = `На выход: <strong>${exitTime}</strong> (${percent}%)`;
			if (percent < 100) {
				setTimeout(update, delay);
			}
		}
		update();
	};
})();
