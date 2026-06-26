chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.get('formFields', ({formFields}) => {
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
				projectFilter: 'true'
			}
		}

		if (!formFields) {
			chrome.storage.local.set({formFields: defaultFields})
		} else {
			// Merge existing fields with defaults to ensure missing sections are initialized
			let updated = false
			for (const key in defaultFields) {
				if (!formFields[key]) {
					formFields[key] = defaultFields[key]
					updated = true
				}
			}
			if (updated) {
				chrome.storage.local.set({formFields})
			}
		}
	})
})
