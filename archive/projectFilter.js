window.getProjectSpan = function(row) {
	const directTable = row.querySelector(':scope > td > table');
	if (!directTable) return null;
	return directTable.querySelector(':scope > tr > td > span.standartTreeRow, :scope > tr > td > span.selectedTreeRow, :scope > tbody > tr > td > span.standartTreeRow, :scope > tbody > tr > td > span.selectedTreeRow');
};

window.applyFilter = function(treeContainer) {
	const searchInput = treeContainer.querySelector('.delprop-search-input');
	const pinToggle = treeContainer.querySelector('.delprop-pin-toggle');
	if (!searchInput || !pinToggle) return;

	// For hierarchical queries (with . or ,), only use the project part for matching
	const rawQuery = searchInput.value.toLowerCase().trim();
	const query = rawQuery.replace(/[,]/g, '.').split('.')[0].trim();
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
		const span = window.getProjectSpan(row);
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
			const isMatchPinned = !showPinnedOnly || window.archiveState.pinnedProjects.has(span.textContent.trim());
			const isMatch = isMatchQuery && isMatchPinned;
			
			currentProjectVisible = isMatch;
			row.style.display = isMatch ? '' : 'none';
		} else {
			row.style.display = currentProjectVisible ? '' : 'none';
		}
	}
};

window.renderPins = function(treeContainer) {
	const mainTableStyle = treeContainer.querySelector('.containerTableStyle');
	if (!mainTableStyle) return;

	const outerTable = mainTableStyle.querySelector('table');
	if (!outerTable) return;

	const tbody = outerTable.querySelector('tbody') || outerTable;
	const rows = Array.from(tbody.children).filter(el => el.tagName === 'TR');

	const rowsCount = rows.length;
	for (let i = 0; i < rowsCount; i++) {
		const row = rows[i];
		const span = window.getProjectSpan(row);
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
				
				if (window.archiveState.pinnedProjects.has(projectCode)) {
					window.archiveState.pinnedProjects.delete(projectCode);
					pin.style.opacity = '0.3';
					row.classList.remove('delprop-row-pinned');
				} else {
					window.archiveState.pinnedProjects.add(projectCode);
					pin.style.opacity = '1';
					row.classList.add('delprop-row-pinned');
				}
				
				chrome.storage.local.set({ pinnedProjects: Array.from(window.archiveState.pinnedProjects) });
				window.applyFilter(treeContainer);
			});
		}

		if (window.archiveState.pinnedProjects.has(projectCode)) {
			pin.style.opacity = '1';
			row.classList.add('delprop-row-pinned');
		} else {
			pin.style.opacity = '0.3';
			row.classList.remove('delprop-row-pinned');
		}
	}
};

window.initProjectFilter = function(treeContainer) {
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

	if (window.archiveState.archiveShowPinnedOnly) {
		pinToggle.classList.add('active');
	}

	searchContainer.appendChild(searchInput);
	searchContainer.appendChild(pinToggle);
	treeContainer.insertBefore(searchContainer, treeContainer.firstChild);

	const mainTableStyle = treeContainer.querySelector('.containerTableStyle');

	searchInput.addEventListener('input', () => {
		const val = searchInput.value.trim();
		// If query contains a dot or comma or is numeric, delegate to smart hierarchical search
		if (val.includes('.') || val.includes(',') || /^\d+$/.test(val)) {
			document.dispatchEvent(new CustomEvent("delPropTrigger", { 
				detail: { action: "smartSearch", query: val } 
			}));
		} else {
			// Always reset DHTMLX tree visibility first (undo any previous smartSearch hiding)
			document.dispatchEvent(new CustomEvent("delPropTrigger", { 
				detail: { action: "smartSearch", query: "" } 
			}));
			// Then apply DOM-level filter for text and pins
			window.applyFilter(treeContainer);
		}
	});

	searchInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			const val = searchInput.value.trim();
			if (val) {
				document.dispatchEvent(new CustomEvent("delPropTrigger", { 
					detail: { action: "smartSearchEnter", query: val } 
				}));
			}
		}
	});

	// Register listeners for input locking and clearing
	document.addEventListener("delPropResponse", (e) => {
		const { action, blocked } = e.detail;
		if (action === "blockSearchInput") {
			searchInput.disabled = blocked;
			if (blocked) {
				searchInput.style.opacity = '0.5';
				searchInput.style.cursor = 'wait';
				searchInput.placeholder = 'Загрузка...';
			} else {
				searchInput.style.opacity = '1';
				searchInput.style.cursor = 'text';
				searchInput.placeholder = 'Фильтр по проектам...';
				searchInput.focus();
			}
		} else if (action === "clearSearchInput") {
			searchInput.value = '';
			document.dispatchEvent(new CustomEvent("delPropTrigger", { 
				detail: { action: "smartSearch", query: "" } 
			}));
		}
	});

	pinToggle.addEventListener('click', () => {
		pinToggle.classList.toggle('active');
		const isActive = pinToggle.classList.contains('active');
		window.archiveState.archiveShowPinnedOnly = isActive;
		chrome.storage.local.set({ archiveShowPinnedOnly: isActive });
		window.applyFilter(treeContainer);
	});

	if (mainTableStyle) {
		// Set up dynamic pin injection when DHTMLX adds/updates elements
		treeContainer._pinObserver = new MutationObserver(() => {
			if (treeContainer._pinObserver) {
				treeContainer._pinObserver.disconnect();
			}
			
			window.renderPins(treeContainer);
			window.applyFilter(treeContainer);
			
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
		window.renderPins(treeContainer);
		window.applyFilter(treeContainer);
	}
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "clearTreeCache") {
		document.dispatchEvent(new CustomEvent("delPropTrigger", { detail: { action: "clearTreeCache" } }));
	}
});
