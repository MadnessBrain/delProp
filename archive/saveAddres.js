// archive/saveAddres.js
const isArchiveOnly = chrome.runtime.getManifest().content_scripts.length === 1;
let archiveSettings = null;
let archiveHashes = {};
let pinnedProjects = new Set();
let archiveShowPinnedOnly = false;

// Load settings and cached hashes from storage
chrome.storage.local.get(['formFields', 'archiveHashes', 'pinnedProjects', 'archiveShowPinnedOnly'], (data) => {
	archiveSettings = isArchiveOnly ? {
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
	archiveHashes = data.archiveHashes || {};
	pinnedProjects = new Set(data.pinnedProjects || []);
	archiveShowPinnedOnly = data.archiveShowPinnedOnly === true || data.archiveShowPinnedOnly === 'true';

	if (archiveSettings.enabled !== 'true') {
		console.log("delProp: Archive enhancements are disabled.");
		return;
	}

	// Scan existing DOM for elements already present
	const existingLabel = document.querySelector('.dhxform_txt_label2.topmost');
	if (existingLabel) {
		docObserver.disconnect();
		docObserver.observe(existingLabel, { childList: true, subtree: true, characterData: true });
		updateHashFromDocName(existingLabel);
	}

	const existingTree = document.querySelector('.dhxtree_dhx_skyblue');
	if (existingTree && archiveSettings.projectFilter === 'true') {
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
		archiveSettings = isArchiveOnly ? {
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
		if (archiveSettings.enabled === 'true') {
			mainObserver.observe(document.body, { childList: true, subtree: true });
		} else {
			mainObserver.disconnect();
			docObserver.disconnect();
		}
	}

	if (changes.archiveHashes) {
		archiveHashes = changes.archiveHashes.newValue || {};
	}

	if (changes.pinnedProjects) {
		pinnedProjects = new Set(changes.pinnedProjects.newValue || []);
		// Trigger filter update on all active tree containers
		document.querySelectorAll('.dhxtree_dhx_skyblue').forEach(container => {
			renderPins(container);
			applyFilter(container);
		});
	}

	if (changes.archiveShowPinnedOnly) {
		archiveShowPinnedOnly = changes.archiveShowPinnedOnly.newValue === 'true' || changes.archiveShowPinnedOnly.newValue === true;
		document.querySelectorAll('.dhxtree_dhx_skyblue').forEach(container => {
			const pinToggle = container.querySelector('.delprop-pin-toggle');
			if (pinToggle) {
				pinToggle.classList.toggle('active', archiveShowPinnedOnly);
			}
			applyFilter(container);
		});
	}
});

function updateHashFromDocName(node) {
	if (!archiveSettings || archiveSettings.enabled !== 'true') return;

	const hash = node.textContent.trim();
	const actvTab = document.querySelector('.dhxtabbar_tab.dhxtabbar_tab_actv');
	if (!actvTab) return;

	const tabText = actvTab.innerText || actvTab.textContent;
	const r = tabText ? tabText.trim() : '';
	if (!r) return;

	if (archiveSettings.saveTabs === 'true') {
		if (hash) {
			archiveHashes[r] = hash;
		} else {
			delete archiveHashes[r];
		}
		chrome.storage.local.set({ archiveHashes });
	}

	window.location.hash = hash ? `#${hash}` : '';
}

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
				break; // Only update once per batch of mutations to avoid layout thrashing
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
			if (treeContainer && archiveSettings.projectFilter === 'true') {
				initProjectFilter(treeContainer);
			}
		}
	}
});

// Document-level event delegation for clicks (tab switching)
document.addEventListener('click', (e) => {
	if (!archiveSettings || archiveSettings.enabled !== 'true') return;

	// Log form button click for compatibility
	if (e.target.closest('.dhxform_btn_txt')) {
		console.log('delProp: Form button clicked');
	}

	const tab = e.target.closest('.dhxtabbar_tab');
	if (!tab) return;

	const tabText = tab.innerText || tab.textContent;
	const tabName = tabText ? tabText.trim() : '';
	if (!tabName) return;

	if (tabName === 'Создать') {
		console.log('delProp: Create tab clicked');
	} else if (archiveSettings.saveTabs === 'true') {
		const hash = archiveHashes[tabName];
		window.location.hash = hash ? `#${hash}` : '';
	}
});

// Document-level event delegation for document name inputs
let inputPrevHash = '';

document.addEventListener('focusin', (e) => {
	if (archiveSettings && archiveSettings.syncDocName === 'true' && e.target.tagName === 'INPUT' && e.target.name === 'doc_name') {
		inputPrevHash = window.location.hash;
	}
});

document.addEventListener('change', (e) => {
	if (archiveSettings && archiveSettings.syncDocName === 'true' && e.target.tagName === 'INPUT' && e.target.name === 'doc_name') {
		const val = e.target.value.trim();
		if (val) {
			window.location.hash = val;
		} else if (inputPrevHash) {
			window.location.hash = inputPrevHash;
		}
	}
});

function getProjectSpan(row) {
	const directTable = row.querySelector(':scope > td > table');
	if (!directTable) return null;
	return directTable.querySelector(':scope > tr > td > span.standartTreeRow, :scope > tr > td > span.selectedTreeRow, :scope > tbody > tr > td > span.standartTreeRow, :scope > tbody > tr > td > span.selectedTreeRow');
}

function applyFilter(treeContainer) {
	const searchInput = treeContainer.querySelector('.delprop-search-input');
	const pinToggle = treeContainer.querySelector('.delprop-pin-toggle');
	if (!searchInput || !pinToggle) return;

	const query = searchInput.value.toLowerCase().trim();
	const showPinnedOnly = pinToggle.classList.contains('active');

	const mainTableStyle = treeContainer.querySelector('.containerTableStyle');
	const outerTable = mainTableStyle ? mainTableStyle.querySelector('table') : null;
	if (!outerTable) return;

	const tbody = outerTable.querySelector('tbody') || outerTable;
	const rows = Array.from(tbody.children).filter(el => el.tagName === 'TR');

	let currentProjectVisible = true;
	const rowsCount = rows.length;
	for (let i = 0; i < rowsCount; i++) {
		const row = rows[i];
		const span = getProjectSpan(row);
		let isProject = false;
		let projectCode = '';
		let projectTitle = '';

		if (span) {
			isProject = true;
			projectCode = span.textContent.trim().toLowerCase();
			const directTable = row.querySelector(':scope > td > table');
			const innerTr = directTable ? directTable.querySelector(':scope > tr[title], :scope > tbody > tr[title]') : null;
			projectTitle = innerTr ? innerTr.getAttribute('title').trim().toLowerCase() : '';
		}

		if (isProject) {
			const isMatchQuery = !query || projectCode.includes(query) || projectTitle.includes(query);
			const isMatchPinned = !showPinnedOnly || pinnedProjects.has(span.textContent.trim());
			const isMatch = isMatchQuery && isMatchPinned;
			
			currentProjectVisible = isMatch;
			row.style.display = isMatch ? '' : 'none';
		} else {
			row.style.display = currentProjectVisible ? '' : 'none';
		}
	}
}

function renderPins(treeContainer) {
	const mainTableStyle = treeContainer.querySelector('.containerTableStyle');
	if (!mainTableStyle) return;

	const outerTable = mainTableStyle.querySelector('table');
	if (!outerTable) return;

	const tbody = outerTable.querySelector('tbody') || outerTable;
	const rows = Array.from(tbody.children).filter(el => el.tagName === 'TR');

	const rowsCount = rows.length;
	for (let i = 0; i < rowsCount; i++) {
		const row = rows[i];
		const span = getProjectSpan(row);
		if (!span) continue;

		const projectCode = span.textContent.trim();
		if (!projectCode) continue;

		const directTable = row.querySelector(':scope > td > table');
		let pin = directTable.querySelector('.delprop-pin');
		if (!pin) {
			pin = document.createElement('span');
			pin.className = 'delprop-pin';
			pin.textContent = '📌';
			pin.style.cursor = 'pointer';
			pin.style.marginLeft = '6px';
			pin.style.fontSize = '12px';
			pin.style.userSelect = 'none';
			pin.title = 'Закрепить проект';
			
			span.parentNode.appendChild(pin);

			pin.addEventListener('click', (e) => {
				e.stopPropagation(); // Avoid triggering DHTMLX node selection
				
				if (pinnedProjects.has(projectCode)) {
					pinnedProjects.delete(projectCode);
					pin.style.opacity = '0.3';
					row.classList.remove('delprop-row-pinned');
				} else {
					pinnedProjects.add(projectCode);
					pin.style.opacity = '1';
					row.classList.add('delprop-row-pinned');
				}
				
				chrome.storage.local.set({ pinnedProjects: Array.from(pinnedProjects) });
				applyFilter(treeContainer);
			});
		}

		if (pinnedProjects.has(projectCode)) {
			pin.style.opacity = '1';
			row.classList.add('delprop-row-pinned');
		} else {
			pin.style.opacity = '0.3';
			row.classList.remove('delprop-row-pinned');
		}
	}
}

function initProjectFilter(treeContainer) {
	if (!treeContainer || treeContainer.querySelector('.delprop-search-container')) return;

	const searchContainer = document.createElement('div');
	searchContainer.className = 'delprop-search-container';

	const searchInput = document.createElement('input');
	searchInput.type = 'text';
	searchInput.className = 'delprop-search-input';
	searchInput.placeholder = 'Фильтр по проектам...';

	const pinToggle = document.createElement('button');
	pinToggle.className = 'delprop-pin-toggle';
	pinToggle.textContent = '📌';
	pinToggle.title = 'Показать только закрепленные';

	if (archiveShowPinnedOnly) {
		pinToggle.classList.add('active');
	}

	searchContainer.appendChild(searchInput);
	searchContainer.appendChild(pinToggle);
	treeContainer.insertBefore(searchContainer, treeContainer.firstChild);

	const mainTableStyle = treeContainer.querySelector('.containerTableStyle');

	searchInput.addEventListener('input', () => {
		applyFilter(treeContainer);
	});

	pinToggle.addEventListener('click', () => {
		pinToggle.classList.toggle('active');
		const isActive = pinToggle.classList.contains('active');
		archiveShowPinnedOnly = isActive;
		chrome.storage.local.set({ archiveShowPinnedOnly });
		applyFilter(treeContainer);
	});

	if (mainTableStyle) {
		// Set up dynamic pin injection when DHTMLX adds/updates elements
		treeContainer._pinObserver = new MutationObserver(() => {
			if (treeContainer._pinObserver) {
				treeContainer._pinObserver.disconnect();
			}
			
			renderPins(treeContainer);
			applyFilter(treeContainer);
			
			if (treeContainer._pinObserver) {
				treeContainer._pinObserver.observe(mainTableStyle, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: ['class', 'style']
				});
			}
		});
		treeContainer._pinObserver.observe(mainTableStyle, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class', 'style']
		});
		
		// Initial rendering of pins
		renderPins(treeContainer);
		applyFilter(treeContainer);
	}
}