(() => {
	window.delProp = window.delProp || {};

	function initAdminPatch() {
		const isAdminField = window.delProp.settings?.mainUserField?.isAdmin;
		const isAdmin = /^true$/i.test(isAdminField);
		
		const s = document.createElement("script");
		s.type = "text/javascript";
		s.dataset.isAdmin = Number(isAdmin);
		s.src = chrome.runtime.getURL('patch/patch.js');
		if (document.body) {
			document.body.append(s);
		} else {
			document.documentElement.appendChild(s);
		}
	}

	function initEmptyDivCleaner() {
		if (document.body) {
			Array.from(document.body.childNodes).forEach(node => {
				if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "") {
					node.remove();
				}
			});
		}

		window.delProp.registerMutationHandler({
			name: 'emptyDivCleaner',
			checkMutation: (mutation) => {
				if (mutation.addedNodes) {
					for (const node of mutation.addedNodes) {
						if (node.nodeType === Node.ELEMENT_NODE && node.localName === 'div' && node.innerHTML === "" && node.className === "") {
							node.remove();
						} else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "") {
							node.remove();
						}
					}
				}
			}
		});
	}

	function initAntiSnow() {
		const styleField = window.delProp.settings?.styleField || {};
		if (styleField.styled === 'true' && styleField.snow === 'on') {
			const cleanSnow = () => {
				document.head.querySelectorAll('script').forEach(script => {
					if (script.src && script.src.includes('snow')) {
						script.remove();
					}
				});
				document.body.querySelectorAll('span').forEach(sp => {
					if (sp.id && sp.id.includes('s')) {
						sp.remove();
					}
				});
			};
			cleanSnow();
			window.delProp.registerMutationHandler({
				name: 'antiSnowRemover',
				check: (node) => node && (node.localName === 'script' || node.localName === 'span'),
				callback: (node) => {
					if (node.localName === 'script' && node.src && node.src.includes('snow')) {
						node.remove();
					}
					if (node.localName === 'span' && node.id && node.id.includes('s')) {
						node.remove();
					}
				}
			});
		}
	}

	function initSiteFilters() {
		const styleField = window.delProp.settings?.styleField || {};
		if (styleField.styled === 'true' && styleField.filter && styleField.filter !== 'none') {
			const filterVal = styleField.filter;
			if (filterVal === 'grayscale(1)') {
				document.body.classList.add('delprop-grayscaled');
			} else if (filterVal === 'invert(1)') {
				document.body.style.filter = 'invert(1)';
				document.body.classList.add('delprop-inverted');
			} else {
				document.body.style.filter = filterVal;
			}
		}
	}

	function initKadrClickHandlers() {
		window.delProp.registerMutationHandler({
			name: 'kadrLayoutObserver',
			check: (node) => node && node.classList && node.classList.contains('dhx_dataview'),
			callback: (imgContainer) => {
				const imageObserver = new MutationObserver(mutations => {
					let srcs = [];
					for (let mutation of mutations) {
						for (let item of mutation.addedNodes) {
							const img = item?.querySelector && item.querySelector('img');
							if (img && img.parentNode && img.parentNode.href) {
								const link = img.parentNode;
								const srcMatch = img.src.match(/kadr\/(\d+)\.jpg/);
								if (srcMatch) {
									const src = srcMatch[1];
									srcs.push(Number(src));
									link.href = '#';
									link.removeAttribute("target");
									link.onclick = (e) => {
										e.preventDefault();
										window.delProp.openModal(img.src);
									};
								}
							}
						}
					}
					if (srcs.length > 0) {
						chrome.storage.local.set({ maxSrc: Math.max(...srcs) });
					}
				});
				imageObserver.observe(imgContainer, { childList: true, subtree: true });
			}
		});
	}

	// User dataset observer (parsed and saved to storage)
	window.delProp.registerMutationHandler({
		name: 'userDetector',
		check: (node) => node && node.dataset && node.dataset.user,
		callback: (node) => {
			try {
				const user = JSON.parse(node.dataset.user);
				const user_input = node.dataset.input;
				chrome.storage.local.set({ user }, () => {
					window.delProp.user = user;
				});
				chrome.storage.local.set({ user_input }, () => {
					window.delProp.user_input = user_input;
				});

			} catch (e) {
				console.error("delProp: error parsing user dataset:", e);
			}
		}
	});

	window.delProp.onCoreReady(() => {
		initAdminPatch();
		initEmptyDivCleaner();
		initAntiSnow();
		initSiteFilters();
		initKadrClickHandlers();
	});
})();
