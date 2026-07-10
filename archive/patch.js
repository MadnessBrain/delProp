// archive/patch.js
(function() {
	const RealOpen = XMLHttpRequest.prototype.open;
	const RealSend = XMLHttpRequest.prototype.send;

	XMLHttpRequest.prototype.open = function(method, url, ...args) {
		this._delpropMethod = method;
		this._delpropUrl = url;
		this._delpropIsCacheable = false;
		
		if (method.toUpperCase() === 'GET' && url.includes('show_tree.php')) {
			try {
				const urlObj = new URL(url, window.location.href);
				const nodeId = urlObj.searchParams.get('id') || '';
				if (nodeId && (nodeId.startsWith('project_') || nodeId === '0' || nodeId === 'root')) {
					this._delpropIsCacheable = true;
					this._delpropNodeId = nodeId;
					this._delpropCacheKey = 'delprop_tree_cache_' + nodeId;
				}
			} catch (e) {
				console.error("delProp: error parsing tree URL:", e);
			}
		}
		return RealOpen.apply(this, [method, url, ...args]);
	};

	XMLHttpRequest.prototype.send = function(body) {
		if (this._delpropIsCacheable) {
			const cacheKey = this._delpropCacheKey;
			const nodeId = this._delpropNodeId;
			const url = this._delpropUrl;
			const cachedData = localStorage.getItem(cacheKey);

			if (cachedData) {
				try {
					const parsed = JSON.parse(cachedData);
					const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
					if (Date.now() - parsed.timestamp < TTL) {
						Object.defineProperties(this, {
							responseText: { value: parsed.data, writable: true },
							responseXML: { 
								value: new DOMParser().parseFromString(parsed.data, 'text/xml'), 
								writable: true 
							},
							status: { value: 200, writable: true },
							statusText: { value: 'OK', writable: true },
							readyState: { value: 4, writable: true }
						});

						setTimeout(() => {
							if (typeof this.onreadystatechange === 'function') {
								this.onreadystatechange();
							}
							this.dispatchEvent(new Event('readystatechange'));
							this.dispatchEvent(new Event('load'));
						}, 0);

						// Background revalidation (Stale-While-Revalidate)
						setTimeout(() => {
							revalidateCache(url, cacheKey, nodeId);
						}, 100);
						return;
					}
				} catch (e) {
					console.error("delProp: error reading tree cache:", e);
				}
			}

			this.addEventListener('load', () => {
				if (this.status === 200 && this.responseText) {
					try {
						localStorage.setItem(cacheKey, JSON.stringify({
							timestamp: Date.now(),
							data: this.responseText
						}));
					} catch (e) {
						console.error("delProp: error caching tree data:", e);
					}
				}
			});
		}
		return RealSend.apply(this, [body]);
	};

	function revalidateCache(url, key, id) {
		fetch(url)
			.then(r => r.arrayBuffer())
			.then(buf => {
				// Server returns windows-1251 encoded XML; decode properly
				const decoder = new TextDecoder('windows-1251');
				const newXml = decoder.decode(buf);
				const cachedObjStr = localStorage.getItem(key);
				let cachedXml = '';
				if (cachedObjStr) {
					try {
						cachedXml = JSON.parse(cachedObjStr).data;
					} catch(e) {}
				}
				
				const normNew = newXml.replace(/\s+/g, ' ');
				const normCached = cachedXml.replace(/\s+/g, ' ');

				if (normNew !== normCached) {
					localStorage.setItem(key, JSON.stringify({
						timestamp: Date.now(),
						data: newXml
					}));

					// Update tree dynamically
					if (typeof MainTabBar !== 'undefined') {
						const actvId = MainTabBar.getActiveTab();
						if (actvId) {
							const Layout = MainTabBar.cells(actvId).getAttachedObject();
							if (Layout) {
								const Tree = Layout.cells("a").getAttachedObject();
								if (Tree && Tree._idpull[id] && Tree.getOpenState(id) === 1) {
									const selectedId = Tree.getSelectedItemId();
									Tree.deleteChildItems(id);
									Tree.loadXMLString(newXml);
									if (selectedId && Tree._idpull[selectedId]) {
										Tree.selectItem(selectedId, false);
									}
								}
							}
						}
					}
				}
			})
			.catch(err => console.error("delProp: revalidation error:", err));
	}
})();

document.addEventListener("delPropTrigger", (e) => {
	const { action, query } = e.detail;
	if (action === "smartSearch") {
		window.searchAndExpandTree(query || "", false);
	} else if (action === "smartSearchEnter") {
		window.searchAndExpandTree(query || "", true);
	} else if (action === "clearTreeCache") {
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key && key.startsWith('delprop_tree_cache_')) {
				localStorage.removeItem(key);
			}
		}
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

function filterProjectsVisibility(Tree, projectPrefix) {
	const projectIds = Tree.getSubItems("0").split(",").filter(Boolean);
	const query = projectPrefix.toLowerCase().trim();
	for (const pid of projectIds) {
		const txt = Tree.getItemText(pid).trim().toLowerCase();
		const isMatch = !query || txt.includes(query);
		setNodeVisible(Tree, pid, isMatch);
	}
}

function filterGroupsVisibility(Tree, activeProjectId, groupPrefix) {
	const groupIds = Tree.getSubItems(activeProjectId).split(",").filter(Boolean);
	const query = groupPrefix.toLowerCase().trim();
	for (const gid of groupIds) {
		const txt = Tree.getItemText(gid).trim().toLowerCase();
		const isMatch = !query || txt.includes(query);
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

	// Normalize query by replacing commas with dots
	const normalizedQuery = (query || "").replace(/,/g, '.');
	const trimmed = normalizedQuery.trim();
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

	// 1. Filter project nodes based on query prefix
	filterProjectsVisibility(Tree, projectCode);

	// Find the matching project node we need to expand/traverse (exact, then startsWith, then includes)
	const projectIds = Tree.getSubItems("0").split(",").filter(Boolean);
	let activeProjectId = null;

	for (const pid of projectIds) {
		const txt = Tree.getItemText(pid).trim().toLowerCase();
		if (txt === projectCode.toLowerCase()) {
			activeProjectId = pid;
			break;
		}
	}
	if (!activeProjectId) {
		for (const pid of projectIds) {
			const txt = Tree.getItemText(pid).trim().toLowerCase();
			if (txt.startsWith(projectCode.toLowerCase())) {
				activeProjectId = pid;
				break;
			}
		}
	}
	if (!activeProjectId) {
		for (const pid of projectIds) {
			const txt = Tree.getItemText(pid).trim().toLowerCase();
			if (txt.includes(projectCode.toLowerCase())) {
				activeProjectId = pid;
				break;
			}
		}
	}

	if (partCount < 2) {
		return;
	}

	if (!activeProjectId) {
		return;
	}

	// 2. Filter groups if we typed project.group
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
		const txt = Tree.getItemText(gid).trim().toLowerCase();
		if (txt === groupCode.toLowerCase()) {
			activeGroupId = gid;
			break;
		}
	}
	if (!activeGroupId) {
		for (const gid of groupIds) {
			const txt = Tree.getItemText(gid).trim().toLowerCase();
			if (txt.startsWith(groupCode.toLowerCase())) {
				activeGroupId = gid;
				break;
			}
		}
	}
	if (!activeGroupId) {
		for (const gid of groupIds) {
			const txt = Tree.getItemText(gid).trim().toLowerCase();
			if (txt.includes(groupCode.toLowerCase())) {
				activeGroupId = gid;
				break;
			}
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
};
