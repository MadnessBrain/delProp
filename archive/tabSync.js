window.archiveState = {
	isArchiveOnly: chrome.runtime.getManifest().content_scripts.length === 1 || chrome.runtime.getManifest().name.includes("электронного архива"),
	archiveSettings: {
		enabled: 'true',
		saveTabs: 'true',
		syncDocName: 'true',
		projectFilter: 'true'
	},
	archiveHashes: {},
	pinnedProjects: new Set(),
	archiveShowPinnedOnly: false
};

window.getTabName = function(tabEl) {
	if (!tabEl) return '';
	const child = tabEl.childNodes[0];
	if (child) {
		const text = child.innerText || child.textContent;
		return text ? text.trim() : '';
	}
	const text = tabEl.innerText || tabEl.textContent;
	return text ? text.trim() : '';
};

// Requests the active doc name and ID from the page context (via archive/patch.js)
window.updateHashFromDocName = function(node) {
	if (!window.archiveState.archiveSettings || window.archiveState.archiveSettings.enabled !== 'true') return;

	// Request from the page context
	document.dispatchEvent(new CustomEvent("delPropRequest", { detail: { action: "getActiveDoc" } }));
};

// Updates hash and local storage once details are received back from page context
window.updateHashAndSave = function(docId, docName, tabName) {
	if (!window.archiveState.archiveSettings || window.archiveState.archiveSettings.enabled !== 'true') return;

	const actvTab = document.querySelector('.dhxtabbar_tab.dhxtabbar_tab_actv');
	if (!actvTab) return;

	const r = tabName || window.getTabName(actvTab);
	if (!r) return;

	if (window.archiveState.archiveSettings.saveTabs === 'true') {
		if (docId) {
			window.archiveState.archiveHashes[r] = docId;
			chrome.storage.local.set({ archiveHashes: window.archiveState.archiveHashes, lastOpenedDoc: docId });
		} else {
			delete window.archiveState.archiveHashes[r];
			chrome.storage.local.set({ archiveHashes: window.archiveState.archiveHashes });
		}
	}

	window.location.hash = docId ? `#${docId}` : '';
};

window.handleTabClick = function(e) {
	if (!window.archiveState.archiveSettings || window.archiveState.archiveSettings.enabled !== 'true') return;

	if (e.target.closest('.dhxform_btn_txt')) {
		console.log('delProp: Form button clicked');
	}

	const tab = e.target.closest('.dhxtabbar_tab');
	if (!tab) return;

	const tabName = window.getTabName(tab);
	if (!tabName) return;

	if (tabName === 'Создать') {
		console.log('delProp: Create tab clicked');
	} else if (window.archiveState.archiveSettings.saveTabs === 'true') {
		const hash = window.archiveState.archiveHashes[tabName];
		window.location.hash = hash ? `#${hash}` : '';
		if (hash) {
			chrome.storage.local.set({ lastOpenedDoc: hash });
		}
	}
};
