// utils/settings.js - shared default settings to avoid duplicating in background.js / popup.js
window.delProp = window.delProp || {};
window.delProp.defaultSettings = {
	changeField: {
		btns: 'false',
		btns_style: 'normal',
		btnName: []
	},
	dellNewsField: {
		news: 'false',
		newsList: []
	},
	styleField: {
		styled: 'false',
		filter: 'none',
		rndImg: 'off',
		semen: 'off',
		snow: 'off',
		colorized: 'false',
		colorTheme: {
			mainColor: '#b5deff',
			mainColorHover: '#e2efff'
		}
	},
	workTimerField: {
		timer: 'false',
		headerEnabled: 'false',
		overtimeToComp: 'false',
		userIcon: '👤',
		timerTheme: 'beer',
		startDay: '07:00',
		endDay: '16:00',
		endDayF: '14:45'
	},
	mainUserField: {
		isAdmin: 'false'
	},
	archiveField: {
		enabled: 'true',
		saveTabs: 'true',
		syncDocName: 'true',
		projectFilter: 'true',
		treeCacheEnabled: 'true'
	}
};
