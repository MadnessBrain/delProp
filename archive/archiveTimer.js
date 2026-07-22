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
		const dayOfWeek = new Date().getDay();

		const { exitTimeStr, startWorkMs, endWorkMs } = helpers.calculateEndWorkTime(
			workTimerField.startDay || '07:00',
			workTimerField.endDay || '16:00',
			workTimerField.endDayF || '14:45',
			userInput,
			dayOfWeek
		);

		function update() {
			const now = Date.now();
			if (dayOfWeek === 6 || dayOfWeek === 0) {
				timerDiv.innerHTML = `На выход: <strong>${exitTimeStr}</strong> (100%)`;
				return;
			}

			if (now < endWorkMs) {
				const { percent, delay } = helpers.getPerDay(startWorkMs, endWorkMs);
				timerDiv.innerHTML = `На выход: <strong>${exitTimeStr}</strong> (${percent}%)`;
				setTimeout(update, delay);
			} else {
				const otStatus = helpers.getOvertimeStatus(now, endWorkMs, '19:00');
				if (otStatus.isOvertime) {
					const formattedOt = helpers.formatMinutes(otStatus.overtimeMinutes);
					timerDiv.innerHTML = `Идет переработка: <strong style="color: #2563eb;">+${formattedOt}</strong> (до 19:00)`;
					setTimeout(update, 30000);
				} else {
					timerDiv.innerHTML = `Переработка завершена <strong style="color: #059669;">(19:00)</strong>`;
				}
			}
		}
		update();
	};
})();
