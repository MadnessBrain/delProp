// archive/saveAddres.js
import { state, updateHashFromDocName, handleTabClick } from './tabSync.js';
import { initProjectFilter, renderPins, applyFilter } from './projectFilter.js';

// Load settings and cached hashes from storage
chrome.storage.local.get(['formFields', 'archiveHashes', 'pinnedProjects', 'archiveShowPinnedOnly', 'lastOpenedDoc'], (data) => {
	state.archiveSettings = state.isArchiveOnly ? {
		enabled: 'true',
		saveTabs: 'true',
		syncDocName: 'true',
		projectFilter: 'true'
	} : (data.formFields?.archiveField || {
		enabled: 'true',
		saveTabs: 'true',
		syncDocName: 'true',
		projectFilter: 'true'
	});
	state.archiveHashes = data.archiveHashes || {};
	state.pinnedProjects = new Set(data.pinnedProjects || []);
	state.archiveShowPinnedOnly = data.archiveShowPinnedOnly === true || data.archiveShowPinnedOnly === 'true';

	if (state.archiveSettings.enabled !== 'true') {
		console.log("delProp: Archive enhancements are disabled.");
		return;
	}

	const lastOpenedDoc = data.lastOpenedDoc;
	if (state.archiveSettings.saveTabs === 'true' && !window.location.hash && lastOpenedDoc) {
		window.location.hash = `#${lastOpenedDoc}`;
	}

	// Scan existing DOM for elements already present
	const existingLabel = document.querySelector('.dhxform_txt_label2.topmost');
	if (existingLabel) {
		docObserver.disconnect();
		docObserver.observe(existingLabel, { childList: true, subtree: true, characterData: true });
		updateHashFromDocName(existingLabel);
	}

	const existingTree = document.querySelector('.dhxtree_dhx_skyblue');
	if (existingTree && state.archiveSettings.projectFilter === 'true') {
		initProjectFilter(existingTree);
	}

	// Initialize main observer
	mainObserver.observe(document.body, { childList: true, subtree: true });
	console.log("delProp: Archive enhancements initialized.");
});

// Watch storage changes to sync settings and cache on the fly
chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== 'local') return;

	if (changes.formFields) {
		state.archiveSettings = state.isArchiveOnly ? {
			enabled: 'true',
			saveTabs: 'true',
			syncDocName: 'true',
			projectFilter: 'true'
		} : (changes.formFields.newValue?.archiveField || {
			enabled: 'true',
			saveTabs: 'true',
			syncDocName: 'true',
			projectFilter: 'true'
		});
		if (state.archiveSettings.enabled === 'true') {
			mainObserver.observe(document.body, { childList: true, subtree: true });
		} else {
			mainObserver.disconnect();
			docObserver.disconnect();
		}
	}

	if (changes.archiveHashes) {
		state.archiveHashes = changes.archiveHashes.newValue || {};
	}

	if (changes.pinnedProjects) {
		state.pinnedProjects = new Set(changes.pinnedProjects.newValue || []);
		// Trigger filter update on all active tree containers
		document.querySelectorAll('.dhxtree_dhx_skyblue').forEach(container => {
			renderPins(container);
			applyFilter(container);
		});
	}

	if (changes.archiveShowPinnedOnly) {
		state.archiveShowPinnedOnly = changes.archiveShowPinnedOnly.newValue === 'true' || changes.archiveShowPinnedOnly.newValue === true;
		document.querySelectorAll('.dhxtree_dhx_skyblue').forEach(container => {
			const pinToggle = container.querySelector('.delprop-pin-toggle');
			if (pinToggle) {
				pinToggle.classList.toggle('active', state.archiveShowPinnedOnly);
			}
			applyFilter(container);
		});
	}
});

const docObserver = new MutationObserver(mutations => {
	const mutationsCount = mutations.length;
	for (let i = 0; i < mutationsCount; i++) {
		const mutation = mutations[i];
		const target = mutation.target;
		if (target) {
			const docNameNode = target.nodeType === Node.ELEMENT_NODE ? 
				(target.closest('.dhxform_txt_label2.topmost') || target) : 
				target.parentElement?.closest('.dhxform_txt_label2.topmost');
			if (docNameNode) {
				updateHashFromDocName(docNameNode);
				break;
			}
		}
	}
});

const mainObserver = new MutationObserver(mutations => {
	const mutationsCount = mutations.length;
	for (let i = 0; i < mutationsCount; i++) {
		const mutation = mutations[i];
		const addedNodes = mutation.addedNodes;
		if (!addedNodes) continue;

		const addedNodesCount = addedNodes.length;
		for (let j = 0; j < addedNodesCount; j++) {
			const node = addedNodes[j];
			if (node.nodeType !== Node.ELEMENT_NODE) continue;

			// Observe the topmost label when it gets added to the DOM
			if (node.classList.contains('dhxform_txt_label2') && node.classList.contains('topmost')) {
				docObserver.disconnect();
				docObserver.observe(node, { childList: true, subtree: true, characterData: true });
				updateHashFromDocName(node);
			}

			// Initialize the project filter if a tree container is added
			const treeContainer = node.classList.contains('dhxtree_dhx_skyblue') ? node : node.querySelector('.dhxtree_dhx_skyblue');
			if (treeContainer && state.archiveSettings.projectFilter === 'true') {
				initProjectFilter(treeContainer);
			}
		}
	}
});

// Document-level event delegation for clicks (tab switching)
document.addEventListener('click', handleTabClick);

// Inject bridge script to page context to call native archive functions
const bridgeScript = document.createElement("script");
bridgeScript.textContent = `
	document.addEventListener("delPropTrigger", (e) => {
		const { action } = e.detail;
		if (typeof MainTabBar === 'undefined' || typeof GetTabIndexByTabID === 'undefined') return;
		const actvId = MainTabBar.getActiveTab();
		if (!actvId) return;
		const main_tab_id = GetTabIndexByTabID(actvId);
		
		if (action === "copyLinkChat" && typeof CopyLinkToBufferChat === 'function') {
			CopyLinkToBufferChat(parseInt(main_tab_id));
		} else if (action === "copyLinkEmail" && typeof CopyLinkToBufferEmail === 'function') {
			CopyLinkToBufferEmail(parseInt(main_tab_id));
		} else if (action === "copyLinkDirect" && typeof CopyLinkToBuffer === 'function') {
			CopyLinkToBuffer(parseInt(main_tab_id));
		} else if (action === "copyMD5" && typeof CopyMD5toBuffer === 'function') {
			CopyMD5toBuffer();
		} else if (action === "downloadZip" && typeof DownloadZip === 'function' && typeof GetCurrentDocID === 'function' && typeof GetCurrentDocName === 'function') {
			const doc_id = GetCurrentDocID();
			const doc_name = GetCurrentDocName();
			DownloadZip(doc_name, doc_id);
		}
	});
`;
document.documentElement.appendChild(bridgeScript);
bridgeScript.remove();

// Key listener for shortcuts
document.addEventListener('keydown', (e) => {
	if (e.altKey && !e.ctrlKey && !e.shiftKey) {
		const code = e.keyCode;
		if (code === 67) { // Alt + C
			e.preventDefault();
			document.dispatchEvent(new CustomEvent("delPropTrigger", { detail: { action: "copyLinkChat" } }));
		} else if (code === 69) { // Alt + E
			e.preventDefault();
			document.dispatchEvent(new CustomEvent("delPropTrigger", { detail: { action: "copyLinkEmail" } }));
		} else if (code === 76) { // Alt + L
			e.preventDefault();
			document.dispatchEvent(new CustomEvent("delPropTrigger", { detail: { action: "copyLinkDirect" } }));
		} else if (code === 77) { // Alt + M
			e.preventDefault();
			document.dispatchEvent(new CustomEvent("delPropTrigger", { detail: { action: "copyMD5" } }));
		} else if (code === 90) { // Alt + Z
			e.preventDefault();
			document.dispatchEvent(new CustomEvent("delPropTrigger", { detail: { action: "downloadZip" } }));
		}
	}
});