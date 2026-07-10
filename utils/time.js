// utils/time.js
window.delProp = window.delProp || {};
window.delProp.timeHelpers = {
	parseTimeToMinutes(timeStr) {
		if (!timeStr || typeof timeStr !== 'string') return null;
		const parts = timeStr.split(':').map(Number);
		if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
		return parts[0] * 60 + parts[1];
	},

	timeNorm(timeStr) {
		if (!timeStr || typeof timeStr !== 'string') { timeStr = '07:00'; }
		let t = timeStr.split(':').map(Number);
		return new Date().setHours(t[0], t[1], 0, 0);
	},

	getPerDay(startWorkMs, endWorkMs) {
		const now = Date.now();
		const linear = (now - startWorkMs) / (endWorkMs - startWorkMs);
		const val = linear < 0 ? 0 : linear > 1 ? 1 : linear;
		const percent = Math.floor(val * 100);
		const remaining = endWorkMs - now;

		let delay;
		if (linear < 0) {
			delay = startWorkMs - now;
		} else if (linear > 1) {
			delay = 60000;
		} else {
			delay = Math.max(5000, remaining * 0.01);
		}

		return {
			percent,
			delay
		};
	}
};
