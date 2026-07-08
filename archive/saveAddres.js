// archive/saveAddres.js

let workTimerField = null;
let userInput = null;

function parseTimeToMinutes(timeStr) {
	if (!timeStr) return null;
	const parts = timeStr.split(':');
	if (parts.length < 2) return null;
	return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function timeNorm(timeStr) {
	const [h, m] = timeStr.split(':').map(Number);
	return h * 3600000 + m * 60000;
}

function getPerDay(startWorkMs, endWorkMs) {
	const now = new Date();
	const nowMs = now.getHours() * 3600000 + now.getMinutes() * 60000 + now.getSeconds() * 1000 + now.getMilliseconds();
	if (nowMs < startWorkMs) {
		return { percent: 0, delay: startWorkMs - nowMs };
	}
	if (nowMs > endWorkMs) {
		return { percent: 100, delay: 0 };
	}
	const total = endWorkMs - startWorkMs;
	const current = nowMs - startWorkMs;
	const percent = Math.floor((current / total) * 100);
	return { percent, delay: 60000 };
}

window.initArchiveTimer = function() {
	if (!workTimerField || document.getElementById('delprop-archive-timer')) return;

	const actvTab = document.querySelector('.dhxtabbar_tab');
	if (!actvTab) return;

	const parent = actvTab.parentNode;
	if (!parent) return;

	parent.style.position = 'relative';

	const timerDiv = document.createElement('div');
	timerDiv.id = 'delprop-archive-timer';
	timerDiv.style.position = 'absolute';
	timerDiv.style.right = '15px';
	timerDiv.style.top = '50%';
	timerDiv.style.transform = 'translateY(-50%)';
	timerDiv.style.fontSize = '11px';
	timerDiv.style.fontFamily = 'Tahoma, Arial, sans-serif';
	timerDiv.style.color = '#333';
	timerDiv.style.zIndex = '999';
	timerDiv.style.pointerEvents = 'none';

	parent.appendChild(timerDiv);

	const start = workTimerField.startDay || '07:00';
	let latenessMin = 0;
	if (userInput) {
		const startMin = parseTimeToMinutes(start);
		const loginMin = parseTimeToMinutes(userInput);
		if (startMin !== null && loginMin !== null && loginMin > startMin) {
			latenessMin = loginMin - startMin;
		}
	}

	const endDay = (new Date().getDay() !== 5 ? (workTimerField.endDay || '16:00') : (workTimerField.endDayF || '14:45'));
	
	let exitTime = endDay;
	if (latenessMin > 0 && latenessMin <= 30) {
		const endMin = parseTimeToMinutes(endDay);
		if (endMin !== null) {
			const finalMin = endMin + latenessMin;
			const fh = String(Math.floor(finalMin / 60)).padStart(2, '0');
			const fm = String(finalMin % 60).padStart(2, '0');
			exitTime = `${fh}:${fm}`;
		}
	}

	const startWork = timeNorm(start);
	const endWork = timeNorm(endDay);

	function update() {
		if (new Date().getDay() === 6 || new Date().getDay() === 0) {
			timerDiv.innerHTML = `На выход: <strong>${exitTime}</strong> (100%)`;
			return;
		}
		const { percent, delay } = getPerDay(startWork, endWork + (latenessMin <= 30 ? latenessMin * 60 * 1000 : 0));
		timerDiv.innerHTML = `На выход: <strong>${exitTime}</strong> (${percent}%)`;
		if (percent < 100) {
			setTimeout(update, delay);
		}
	}
	update();
};

// Load settings and cached hashes from storage
chrome.storage.local.get(['formFields', 'archiveHashes', 'pinnedProjects', 'archiveShowPinnedOnly', 'lastOpenedDoc', 'user_input'], (data) => {
	workTimerField = data.formFields?.workTimerField;
	userInput = data.user_input;

	window.archiveState.archiveSettings = window.archiveState.isArchiveOnly ? {
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
	window.archiveState.archiveHashes = data.archiveHashes || {};
	window.archiveState.pinnedProjects = new Set(data.pinnedProjects || []);
	window.archiveState.archiveShowPinnedOnly = data.archiveShowPinnedOnly === true || data.archiveShowPinnedOnly === 'true';

	if (window.archiveState.archiveSettings.enabled !== 'true') {
		console.log("delProp: Archive enhancements are disabled.");
		return;
	}

	const lastOpenedDoc = data.lastOpenedDoc;
	if (window.archiveState.archiveSettings.saveTabs === 'true' && !window.location.hash && lastOpenedDoc) {
		window.location.hash = `#${lastOpenedDoc}`;
	}

	// Scan existing DOM for elements already present
	const existingLabel = document.querySelector('.dhxform_txt_label2.topmost');
	if (existingLabel) {
		docObserver.disconnect();
		docObserver.observe(existingLabel, { childList: true, subtree: true, characterData: true });
		window.updateHashFromDocName(existingLabel);
	}

	const existingTree = document.querySelector('.dhxtree_dhx_skyblue');
	if (existingTree && window.archiveState.archiveSettings.projectFilter === 'true') {
		window.initProjectFilter(existingTree);
	}

	window.initArchiveTimer();

	// Initialize main observer
	mainObserver.observe(document.body, { childList: true, subtree: true });
	console.log("delProp: Archive enhancements initialized.");
});

// Watch storage changes to sync settings and cache on the fly
chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== 'local') return;

	if (changes.formFields) {
		window.archiveState.archiveSettings = window.archiveState.isArchiveOnly ? {
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
		if (window.archiveState.archiveSettings.enabled === 'true') {
			mainObserver.observe(document.body, { childList: true, subtree: true });
		} else {
			mainObserver.disconnect();
			docObserver.disconnect();
		}
	}

	if (changes.archiveHashes) {
		window.archiveState.archiveHashes = changes.archiveHashes.newValue || {};
	}

	if (changes.pinnedProjects) {
		window.archiveState.pinnedProjects = new Set(changes.pinnedProjects.newValue || []);
		// Trigger filter update on all active tree containers
		document.querySelectorAll('.dhxtree_dhx_skyblue').forEach(container => {
			window.renderPins(container);
			window.applyFilter(container);
		});
	}

	if (changes.archiveShowPinnedOnly) {
		window.archiveState.archiveShowPinnedOnly = changes.archiveShowPinnedOnly.newValue === 'true' || changes.archiveShowPinnedOnly.newValue === true;
		document.querySelectorAll('.dhxtree_dhx_skyblue').forEach(container => {
			const pinToggle = container.querySelector('.delprop-pin-toggle');
			if (pinToggle) {
				pinToggle.classList.toggle('active', window.archiveState.archiveShowPinnedOnly);
			}
			window.applyFilter(container);
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
				window.updateHashFromDocName(docNameNode);
				break;
			}
		}
	}
});

const mainObserver = new MutationObserver(mutations => {
	window.initArchiveTimer();
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
				window.updateHashFromDocName(node);
			}

			// Initialize the project filter if a tree container is added
			const treeContainer = node.classList.contains('dhxtree_dhx_skyblue') ? node : node.querySelector('.dhxtree_dhx_skyblue');
			if (treeContainer && window.archiveState.archiveSettings.projectFilter === 'true') {
				window.initProjectFilter(treeContainer);
			}
		}
	}
});

// Document-level event delegation for clicks (tab switching)
document.addEventListener('click', window.handleTabClick);

// Listen for document info response from the page context (via archive/patch.js)
document.addEventListener("delPropResponse", (e) => {
	const { action, doc_id, doc_name, tabName } = e.detail;
	if (action === "activeDoc") {
		window.updateHashAndSave(doc_id, doc_name, tabName);
	}
});

// Inject patch.js to page context to call native archive functions and retrieve doc details
const patchScript = document.createElement('script');
patchScript.src = chrome.runtime.getURL('archive/patch.js');
patchScript.onload = function() {
	this.remove();
};
(document.head || document.documentElement).appendChild(patchScript);

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