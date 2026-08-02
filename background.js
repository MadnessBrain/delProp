// background.js - service worker for delProp extension
// Uses shared default settings to avoid duplication with popup.js

chrome.runtime.onInstalled.addListener(() => {
	// Inline defaults because service workers can't reliably load utils module synchronously
	// Keep in sync with utils/settings.js - the source of truth
	const defaultFields = {
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

	chrome.storage.local.get('formFields', ({formFields}) => {
		if (!formFields) {
			chrome.storage.local.set({formFields: defaultFields});
		} else {
			// Merge existing fields with defaults to ensure missing sections are initialized
			let updated = false;
			for (const key in defaultFields) {
				if (!formFields[key]) {
					formFields[key] = defaultFields[key];
					updated = true;
				}
			}
			if (updated) {
				chrome.storage.local.set({formFields});
			}
		}
	});
});
