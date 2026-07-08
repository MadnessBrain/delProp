// archive/patch.js
document.addEventListener("delPropTrigger", (e) => {
	const { action, query } = e.detail;
	if (action === "smartSearch") {
		window.searchAndExpandTree(query || "", false);
	} else if (action === "smartSearchEnter") {
		window.searchAndExpandTree(query || "", true);
	} else if (typeof MainTabBar === 'undefined' || typeof GetTabIndexByTabID === 'undefined') {
		return;
	} else {
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
	}
});

document.addEventListener("delPropRequest", (e) => {
	const { action } = e.detail;
	if (action === "getActiveDoc") {
		const tryGet = () => {
			try {
				if (typeof GetCurrentDocID !== 'function' || typeof GetCurrentDocName !== 'function') return '';
				const doc_id = GetCurrentDocID();
				const doc_name = GetCurrentDocName();
				
				const actvTab = document.querySelector('.dhxtabbar_tab.dhxtabbar_tab_actv');
				let tabName = '';
				if (actvTab) {
					const child = actvTab.childNodes[0];
					tabName = (child ? (child.innerText || child.textContent) : (actvTab.innerText || actvTab.textContent)) || '';
					tabName = tabName.trim();
				}
				
				document.dispatchEvent(new CustomEvent("delPropResponse", {
					detail: { action: "activeDoc", doc_id, doc_name, tabName }
				}));
				return doc_id;
			} catch (err) {
				console.error("delProp error in page context:", err);
			}
			return '';
		};

		// Try immediately
		const id = tryGet();
		if (!id) {
			// Retry after 100ms and 300ms if not ready yet
			setTimeout(tryGet, 100);
			setTimeout(tryGet, 300);
		}
	}
});

// Helper functions for DHTMLX Tree manipulation
function setNodeVisible(Tree, nodeId, visible) {
	const nodeObj = Tree._idpull[nodeId];
	if (!nodeObj) return;

	if (nodeObj.htmlNode) {
		nodeObj.htmlNode.style.display = visible ? '' : 'none';
		const sibling = nodeObj.htmlNode.nextSibling;
		if (sibling && sibling.tagName === 'TR') {
			sibling.style.display = visible ? '' : 'none';
		}
	}
}

function resetTreeVisibility(Tree) {
	const idpull = Tree._idpull;
	for (const id in idpull) {
		const nodeObj = idpull[id];
		if (nodeObj && nodeObj.htmlNode) {
			nodeObj.htmlNode.style.display = '';
			const sibling = nodeObj.htmlNode.nextSibling;
			if (sibling && sibling.tagName === 'TR') {
				sibling.style.display = '';
			}
		}
	}
}

function filterProjectsVisibility(Tree, activeProjectId) {
	const projectIds = Tree.getSubItems("0").split(",").filter(Boolean);
	for (const pid of projectIds) {
		setNodeVisible(Tree, pid, pid === activeProjectId);
	}
}

function filterGroupsVisibility(Tree, activeProjectId, groupPrefix) {
	const groupIds = Tree.getSubItems(activeProjectId).split(",").filter(Boolean);
	const query = groupPrefix.toLowerCase().trim();
	for (const gid of groupIds) {
		const txt = Tree.getItemText(gid).trim().toLowerCase();
		const isMatch = !query || txt.startsWith(query);
		setNodeVisible(Tree, gid, isMatch);
	}
}

function filterDrawingsVisibility(Tree, activeGroupId, drawingPrefix) {
	const drawingIds = Tree.getSubItems(activeGroupId).split(",").filter(Boolean);
	const query = drawingPrefix.toLowerCase().trim();
	for (const did of drawingIds) {
		const txt = Tree.getItemText(did).trim().toLowerCase();
		const parts = txt.split('.');
		const lastPart = parts[parts.length - 1] || '';
		const isMatch = !query || txt.includes(query) || lastPart.startsWith(query);
		setNodeVisible(Tree, did, isMatch);
	}
}

function waitForChildrenLoad(Tree, nodeId, callback) {
	let attempts = 0;
	const interval = setInterval(() => {
		const subItems = Tree.getSubItems(nodeId);
		attempts++;
		if ((subItems && subItems.split(",").filter(Boolean).length > 0) || attempts > 60) {
			clearInterval(interval);
			callback();
		}
	}, 100);
}

function dispatchBlockInput(blocked) {
	document.dispatchEvent(new CustomEvent("delPropResponse", { detail: { action: "blockSearchInput", blocked } }));
}

function dispatchClearInput() {
	document.dispatchEvent(new CustomEvent("delPropResponse", { detail: { action: "clearSearchInput" } }));
}

window.searchAndExpandTree = function(query, triggerEnter = false) {
	if (typeof MainTabBar === 'undefined') return;
	const actvId = MainTabBar.getActiveTab();
	if (!actvId) return;
	const Layout = MainTabBar.cells(actvId).getAttachedObject();
	if (!Layout) return;
	const Tree = Layout.cells("a").getAttachedObject();
	if (!Tree) return;

	const trimmed = query.trim();
	if (!trimmed) {
		resetTreeVisibility(Tree);
		return;
	}

	// Parse query parts
	const parts = trimmed.split('.');
	const partCount = parts.length;

	const projectCode = parts[0] ? parts[0].trim() : '';
	const groupCode = parts[1] ? parts[1].trim() : '';
	const drawingCode = parts[2] ? parts[2].trim() : '';

	// 1. Find matching project
	const projectIds = Tree.getSubItems("0").split(",").filter(Boolean);
	let activeProjectId = null;

	for (const pid of projectIds) {
		const txt = Tree.getItemText(pid).trim();
		if (txt === projectCode) {
			activeProjectId = pid;
			break;
		}
	}

	if (!activeProjectId) {
		// Project not found, revert to default matching
		resetTreeVisibility(Tree);
		return;
	}

	// Hide other projects
	filterProjectsVisibility(Tree, activeProjectId);

	// 2. Filter groups if we typed project.group
	if (partCount >= 2) {
		// If project is collapsed, expand it!
		if (Tree.getOpenState(activeProjectId) !== 1) {
			Tree.openItem(activeProjectId);
			dispatchBlockInput(true);
			
			waitForChildrenLoad(Tree, activeProjectId, () => {
				dispatchBlockInput(false);
				window.searchAndExpandTree(query, triggerEnter);
			});
			return;
		}

		// Project is expanded! Filter groups
		filterGroupsVisibility(Tree, activeProjectId, groupCode);

		const groupIds = Tree.getSubItems(activeProjectId).split(",").filter(Boolean);
		let activeGroupId = null;

		for (const gid of groupIds) {
			const txt = Tree.getItemText(gid).trim();
			if (txt === groupCode) {
				activeGroupId = gid;
				break;
			}
		}

		// 3. Filter drawings if we typed project.group.drawing
		if (partCount >= 3 && activeGroupId) {
			// If group is collapsed, expand it!
			if (Tree.getOpenState(activeGroupId) !== 1) {
				Tree.openItem(activeGroupId);
				dispatchBlockInput(true);
				
				waitForChildrenLoad(Tree, activeGroupId, () => {
					dispatchBlockInput(false);
					window.searchAndExpandTree(query, triggerEnter);
				});
				return;
			}

			// Group is expanded! Filter drawings
			filterDrawingsVisibility(Tree, activeGroupId, drawingCode);

			// 4. If user hit Enter, attempt to select and open matching drawing
			if (triggerEnter) {
				const drawingIds = Tree.getSubItems(activeGroupId).split(",").filter(Boolean);
				let matchedDrawingId = null;

				for (const did of drawingIds) {
					const txt = Tree.getItemText(did).trim().toLowerCase();
					const drawingParts = txt.split('.');
					const lastPart = drawingParts[drawingParts.length - 1] || '';

					if (txt === drawingCode.toLowerCase() || lastPart === drawingCode.toLowerCase() || txt === trimmed.toLowerCase()) {
						matchedDrawingId = did;
						break;
					}
				}

				if (matchedDrawingId) {
					// Select drawing and trigger double click or select event
					Tree.selectItem(matchedDrawingId, true);
					
					// Clear input
					dispatchClearInput();
				}
			}
		}
	}
};
