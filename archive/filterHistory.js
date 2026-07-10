// archive/filterHistory.js
// Shell-style search history for the archive project filter.
// Arrow Up/Down navigates through past queries, Enter saves to history.

(function() {
	const MAX_HISTORY = 50;
	let history = [];
	let historyIndex = -1;
	let currentUnsaved = '';

	window.initFilterHistory = function(searchInput) {
		chrome.storage.local.get(['archiveFilterHistory'], (data) => {
			history = data.archiveFilterHistory || [];
		});

		searchInput.addEventListener('keydown', (e) => {
			// Only handle history navigation when autocomplete dropdown is NOT visible
			const dropdown = document.querySelector('.delprop-autocomplete-dropdown');
			if (dropdown && dropdown.style.display !== 'none' && dropdown.children.length > 0) {
				return; // Let autocomplete handle arrow keys
			}

			if (e.key === 'ArrowUp') {
				e.preventDefault();
				if (history.length === 0) return;
				if (historyIndex === -1) {
					currentUnsaved = searchInput.value;
				}
				if (historyIndex < history.length - 1) {
					historyIndex++;
					searchInput.value = history[history.length - 1 - historyIndex];
					searchInput.dispatchEvent(new Event('input'));
				}
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				if (historyIndex > 0) {
					historyIndex--;
					searchInput.value = history[history.length - 1 - historyIndex];
					searchInput.dispatchEvent(new Event('input'));
				} else if (historyIndex === 0) {
					historyIndex = -1;
					searchInput.value = currentUnsaved;
					searchInput.dispatchEvent(new Event('input'));
				}
			}
		});
	};

	window.saveToFilterHistory = function(query) {
		if (!query || !query.trim()) return;
		const trimmed = query.trim();
		// Don't duplicate the last entry
		if (history.length > 0 && history[history.length - 1] === trimmed) return;
		// Remove earlier duplicate if exists (move to end)
		const existingIdx = history.indexOf(trimmed);
		if (existingIdx !== -1) {
			history.splice(existingIdx, 1);
		}
		history.push(trimmed);
		if (history.length > MAX_HISTORY) {
			history = history.slice(-MAX_HISTORY);
		}
		historyIndex = -1;
		currentUnsaved = '';
		chrome.storage.local.set({ archiveFilterHistory: history });
	};

	window.resetFilterHistoryIndex = function() {
		historyIndex = -1;
		currentUnsaved = '';
	};
})();
