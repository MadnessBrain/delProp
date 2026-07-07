export const state = {
	isArchiveOnly: chrome.runtime.getManifest().content_scripts.length === 1,
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

export function getTabName(tabEl) {
	if (!tabEl) return '';
	const child = tabEl.childNodes[0];
	if (child) {
		const text = child.innerText || child.textContent;
		return text ? text.trim() : '';
	}
	const text = tabEl.innerText || tabEl.textContent;
	return text ? text.trim() : '';
}

export function updateHashFromDocName(node) {
	if (!state.archiveSettings || state.archiveSettings.enabled !== 'true') return;

	// Find the doc_id input inside the active tab's form using node.closest
	const formContainer = node.closest('.dhxform_base') || node.closest('form') || document;
	const docIdInput = formContainer.querySelector('input[name="doc_id"]');
	const docId = docIdInput ? docIdInput.value.trim() : '';

	const actvTab = document.querySelector('.dhxtabbar_tab.dhxtabbar_tab_actv');
	if (!actvTab) return;

	const r = getTabName(actvTab);
	if (!r) return;

	if (state.archiveSettings.saveTabs === 'true') {
		if (docId) {
			state.archiveHashes[r] = docId;
			chrome.storage.local.set({ archiveHashes: state.archiveHashes, lastOpenedDoc: docId });
		} else {
			delete state.archiveHashes[r];
			chrome.storage.local.set({ archiveHashes: state.archiveHashes });
		}
	}

	window.location.hash = docId ? `#${docId}` : '';
}

export function handleTabClick(e) {
	if (!state.archiveSettings || state.archiveSettings.enabled !== 'true') return;

	if (e.target.closest('.dhxform_btn_txt')) {
		console.log('delProp: Form button clicked');
	}

	const tab = e.target.closest('.dhxtabbar_tab');
	if (!tab) return;

	const tabName = getTabName(tab);
	if (!tabName) return;

	if (tabName === 'Создать') {
		console.log('delProp: Create tab clicked');
	} else if (state.archiveSettings.saveTabs === 'true') {
		const hash = state.archiveHashes[tabName];
		window.location.hash = hash ? `#${hash}` : '';
		if (hash) {
			chrome.storage.local.set({ lastOpenedDoc: hash });
		}
	}
}
