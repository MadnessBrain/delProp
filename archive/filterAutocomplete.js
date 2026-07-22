// archive/filterAutocomplete.js
// Autocomplete dropdown for the archive project filter.
// Shows suggestions from the DHTMLX tree as the user types.

(function() {
	let dropdown = null;
	let activeIndex = -1;
	let items = [];
	let searchInput = null;
	let isMouseInDropdown = false;
	let suppressAutocomplete = false;

	// Hint code to display text mapping (keeps Cyrillic out of patch.js for obfuscation safety)
	const HINT_TEXTS = {
		'HINT_EXPAND_PROJECT': '💡 Раскройте проект для подсказок',
		'HINT_EXPAND_GROUP': '💡 Раскройте группу для подсказок'
	};

	function createDropdown(inputEl) {
		dropdown = document.createElement('div');
		dropdown.className = 'delprop-autocomplete-dropdown';
		dropdown.style.display = 'none';

		dropdown.addEventListener('mouseenter', () => { isMouseInDropdown = true; });
		dropdown.addEventListener('mouseleave', () => { isMouseInDropdown = false; });

		inputEl.parentNode.style.position = 'relative';
		inputEl.parentNode.appendChild(dropdown);
		return dropdown;
	}

	function hideDropdown() {
		if (dropdown) {
			dropdown.style.display = 'none';
			dropdown.innerHTML = '';
			activeIndex = -1;
			items = [];
		}
	}

	function showDropdown(suggestions) {
		if (!dropdown || suggestions.length === 0) {
			hideDropdown();
			return;
		}

		dropdown.innerHTML = '';
		activeIndex = -1;
		items = suggestions;

		suggestions.forEach((item, idx) => {
			const div = document.createElement('div');
			div.className = 'delprop-autocomplete-item';
			if (item.hint) {
				div.classList.add('delprop-autocomplete-hint');
				// Decode hint codes to readable Cyrillic text
				div.textContent = HINT_TEXTS[item.text] || item.text;
			} else {
				// Highlight matching part
				const query = searchInput.value.trim().toLowerCase();
				const parts = query.replace(/,/g, '.').split('.');
				const lastPart = parts[parts.length - 1] || '';
				const textLower = item.text.toLowerCase();
				const matchIdx = lastPart ? textLower.indexOf(lastPart) : -1;

				if (matchIdx !== -1 && lastPart) {
					const before = item.text.substring(0, matchIdx);
					const match = item.text.substring(matchIdx, matchIdx + lastPart.length);
					const after = item.text.substring(matchIdx + lastPart.length);
					div.innerHTML = `${escapeHtml(before)}<strong>${escapeHtml(match)}</strong>${escapeHtml(after)}`;
				} else {
					div.textContent = item.text;
				}

				if (item.title) {
					const titleSpan = document.createElement('span');
					titleSpan.className = 'delprop-autocomplete-title';
					titleSpan.textContent = item.title;
					div.appendChild(titleSpan);
				}
			}

			div.addEventListener('mouseenter', () => {
				setActive(idx);
			});

			div.addEventListener('click', () => {
				if (!item.hint) {
					selectItem(item);
				}
			});

			dropdown.appendChild(div);
		});

		dropdown.style.display = 'block';
	}

	function escapeHtml(str) {
		const div = document.createElement('div');
		div.appendChild(document.createTextNode(str));
		return div.innerHTML;
	}

	function setActive(idx) {
		const children = dropdown.children;
		for (let i = 0; i < children.length; i++) {
			children[i].classList.remove('delprop-autocomplete-active');
		}
		if (idx >= 0 && idx < children.length) {
			children[idx].classList.add('delprop-autocomplete-active');
			children[idx].scrollIntoView({ block: 'nearest' });
		}
		activeIndex = idx;
	}

	function selectItem(item) {
		if (!searchInput) return;
		suppressAutocomplete = true;
		searchInput.value = item.fullPath;
		hideDropdown();
		window.resetFilterHistoryIndex();
		searchInput.dispatchEvent(new Event('input'));
		searchInput.focus();
		// Reset suppression after the input event has been processed
		setTimeout(() => { suppressAutocomplete = false; }, 0);
	}

	function requestSuggestions(query) {
		document.dispatchEvent(new CustomEvent("delPropTrigger", {
			detail: { action: "getAutocompleteSuggestions", query: query }
		}));
	}

	// Allow external modules (e.g. filterHistory) to suppress autocomplete temporarily
	window.suppressAutocomplete = function() {
		suppressAutocomplete = true;
		hideDropdown();
		setTimeout(() => { suppressAutocomplete = false; }, 0);
	};

	window.initFilterAutocomplete = function(inputEl) {
		searchInput = inputEl;
		createDropdown(inputEl);

		// Listen for suggestions from patch.js
		document.addEventListener("delPropResponse", (e) => {
			if (e.detail.action === "autocompleteSuggestions") {
				if (suppressAutocomplete) return; // Don't show during history navigation
				showDropdown(e.detail.suggestions || []);
			}
		});

		// Request suggestions on input
		inputEl.addEventListener('input', () => {
			if (suppressAutocomplete) return;
			const val = inputEl.value.trim();
			if (val.length > 0) {
				requestSuggestions(val);
			} else {
				hideDropdown();
			}
		});

		// Keyboard navigation in dropdown
		inputEl.addEventListener('keydown', (e) => {
			if (!dropdown || dropdown.style.display === 'none' || items.length === 0) {
				return;
			}

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				e.stopImmediatePropagation();
				// Skip hint items
				let next = activeIndex + 1;
				while (next < items.length && items[next].hint) next++;
				if (next < items.length) {
					setActive(next);
				}
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				e.stopImmediatePropagation();
				let prev = activeIndex - 1;
				while (prev >= 0 && items[prev].hint) prev--;
				if (prev >= 0) {
					setActive(prev);
				} else {
					activeIndex = -1;
					const children = dropdown.children;
					for (let i = 0; i < children.length; i++) {
						children[i].classList.remove('delprop-autocomplete-active');
					}
				}
			} else if (e.key === 'Enter') {
				if (activeIndex >= 0 && activeIndex < items.length && !items[activeIndex].hint) {
					e.preventDefault();
					selectItem(items[activeIndex]);
				} else {
					hideDropdown();
				}
			} else if (e.key === 'Escape') {
				e.preventDefault();
				hideDropdown();
			}
		});

		// Close on outside click
		document.addEventListener('click', (e) => {
			if (dropdown && !dropdown.contains(e.target) && e.target !== inputEl) {
				hideDropdown();
			}
		});

		// Close on blur (unless mouse is in dropdown)
		inputEl.addEventListener('blur', () => {
			setTimeout(() => {
				if (!isMouseInDropdown) {
					hideDropdown();
				}
			}, 150);
		});
	};
})();
