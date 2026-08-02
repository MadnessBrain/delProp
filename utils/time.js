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

	formatMinutes(totalMin) {
		if (totalMin === null || totalMin === undefined || isNaN(totalMin)) return '0ч 0м';
		const isNeg = totalMin < 0;
		const absMin = Math.abs(totalMin);
		const h = Math.floor(absMin / 60);
		const m = absMin % 60;
		const res = `${h}ч ${m}м`;
		return isNeg ? `-${res}` : res;
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
	},

	calculateEndWorkTime(startStr = '07:00', endStr = '16:00', endFStr = '14:45', userInput = null, dayOfWeek = new Date().getDay()) {
		const startMin = this.parseTimeToMinutes(startStr) || 420;
		const defaultEndStr = (dayOfWeek === 5) ? endFStr : endStr;
		let endMin = this.parseTimeToMinutes(defaultEndStr) || (dayOfWeek === 5 ? 885 : 960);
		
		let latenessMin = 0;
		if (userInput) {
			const loginMin = this.parseTimeToMinutes(userInput);
			if (loginMin !== null && loginMin > startMin) {
				const diff = loginMin - startMin;
				if (diff > 0 && diff <= 30) {
					latenessMin = diff;
					endMin += latenessMin;
				}
			}
		}

		const fh = String(Math.floor(endMin / 60)).padStart(2, '0');
		const fm = String(endMin % 60).padStart(2, '0');
		const exitTimeStr = `${fh}:${fm}`;

		const startWorkMs = this.timeNorm(startStr);
		const endWorkMs = this.timeNorm(exitTimeStr);

		return {
			startMin,
			endMin,
			latenessMin,
			exitTimeStr,
			startWorkMs,
			endWorkMs
		};
	},

	getOvertimeStatus(nowMs = Date.now(), endWorkMs = null, maxOvertimeStr = '19:00') {
		const maxOvertimeMs = this.timeNorm(maxOvertimeStr);
		const isOvertime = nowMs >= endWorkMs && nowMs < maxOvertimeMs;
		const isMaxReached = nowMs >= maxOvertimeMs;
		
		let overtimeMinutes = 0;
		if (nowMs > endWorkMs) {
			const activeEndMs = Math.min(nowMs, maxOvertimeMs);
			overtimeMinutes = Math.floor((activeEndMs - endWorkMs) / 60000);
		}

		return {
			isOvertime,
			isMaxReached,
			overtimeMinutes,
			maxOvertimeMs
		};
	},

	// Unified workday bounds: start/end timestamps adjusted for Friday and lateness (<=30 min shifts end)
	getWorkDayBounds(startStr = '07:00', endStr = '16:00', endFStr = '14:45', userInput = null, dayOfWeek = new Date().getDay()) {
		const start = startStr || '07:00';
		const end = endStr || '16:00';
		const endF = endFStr || '14:45';

		let startWork = this.timeNorm(start);
		let endWork = this.timeNorm(dayOfWeek === 5 ? endF : end);

		if (endWork <= startWork) {
			endWork += 24 * 60 * 60 * 1000;
		}

		let latenessMin = 0;
		if (userInput) {
			const startMin = this.parseTimeToMinutes(start);
			const loginMin = this.parseTimeToMinutes(userInput);
			if (startMin !== null && loginMin !== null && loginMin > startMin) {
				latenessMin = loginMin - startMin;
				if (latenessMin <= 30) {
					endWork += latenessMin * 60 * 1000;
				}
			}
		}

		// Exit time as a normalized HH:MM string (no "14:75" style overflow)
		const appliedLateness = latenessMin <= 30 ? latenessMin : 0;
		const baseEndMin = this.parseTimeToMinutes(dayOfWeek === 5 ? endF : end) || 0;
		const exitTotalMin = baseEndMin + appliedLateness;
		const exitTimeStr = `${String(Math.floor(exitTotalMin / 60) % 24).padStart(2, '0')}:${String(exitTotalMin % 60).padStart(2, '0')}`;

		return { startWork, endWork, latenessMin, exitTimeStr };
	}
};
