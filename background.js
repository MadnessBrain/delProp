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
			newsList: [],
			showImages: 'false',
			imageFilter: 'anime'
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

// --- Random images instead of news (all sources are SFW) ---
// Fetching runs in the service worker so it isn't blocked by the portal page CSP/CORS.
const IMAGE_SOURCES = {
	anime:  { url: () => 'https://api.waifu.pics/sfw/waifu',        pick: (j) => j && j.url },
	neko:   { url: () => 'https://nekos.best/api/v2/neko',          pick: (j) => j && j.results && j.results[0] && j.results[0].url },
	cats:   { url: () => 'https://api.thecatapi.com/v1/images/search', pick: (j) => Array.isArray(j) && j[0] && j[0].url },
	// picsum returns the image directly — no JSON fetch needed
	photos: { url: () => `https://picsum.photos/600/400?random=${Date.now()}`, pick: null }
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (!msg || msg.type !== 'delprop_random_image') return;

	const source = IMAGE_SOURCES[msg.filter] || IMAGE_SOURCES.anime;

	// Direct image endpoint: respond synchronously
	if (!source.pick) {
		sendResponse({ url: source.url() });
		return;
	}

	fetch(source.url(), { cache: 'no-store' })
		.then(r => r.json())
		.then(j => sendResponse({ url: source.pick(j) || null }))
		.catch(err => {
			console.error('delProp: image fetch error:', err);
			sendResponse({ url: null, error: String(err) });
		});

	return true; // keep the message channel open for the async response
});
