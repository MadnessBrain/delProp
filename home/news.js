(() => {
	window.delProp = window.delProp || {};

	function applySemenStyle() {
		const styleField = window.delProp.settings?.styleField || {};
		if (styleField.styled === 'true' && styleField.semen === 'on') {
			const newsList = document.querySelector('div[id*="ListObject_"]');
			if (newsList) {
				newsList.style.backgroundImage = `url(${chrome.runtime.getURL('img/zhir.png')})`;
				newsList.style.backgroundSize = 'cover';
				newsList.querySelectorAll('div[class*="dhx_list"]').forEach(news => {
					news.style.color = 'wheat'; 
					news.style.backgroundColor = 'inherit';
				});
			}
		}
	}

	function initNewsCleaner() {
		const dellNewsField = window.delProp.settings?.dellNewsField || {};
		let customNewsList = [];

		// Fetch custom news from db.json
		fetch(chrome.runtime.getURL('db/db.json'))
			.then(r => r.json())
			.then(data => {
				customNewsList = data.custom_news || [];
			})
			.catch(err => console.error("delProp: Error loading custom news:", err));
		
		if (window.delProp.settings?.styleField?.semen === 'on') {
			setTimeout(applySemenStyle, 300);
			window.addEventListener('resize', applySemenStyle);
			document.addEventListener('click', applySemenStyle);
		}

		window.delProp.registerMutationHandler({
			name: 'newsCleaner',
			check: (node) => node && node.classList && node.classList.contains('dhx_list_item'),
			callback: (node) => {
				let retries = 0;
				const maxRetries = 25; // 250ms total

				function checkAndClean() {
					if (!node.parentNode) return; // Already removed or detached

					if (node.className.includes('dhx_list_news_item_selected')) {
						node.className = node.className.split('_selected')[0];
					}

					const isNews = node.className.includes('dhx_list_news_item');
					const id = node.getAttribute("dhx_f_id");

					// Defer if class or attribute is not set yet
					if ((!isNews || !id) && retries < maxRetries) {
						retries++;
						setTimeout(checkAndClean, 10);
						return;
					}

					// Exit if it's not a news item or lacks ID
					if (!isNews || !id) {
						return;
					}

					const parent = node.parentNode;
					if (parent) {
						// Collect IDs currently in the DOM
						const items = parent.querySelectorAll('.dhx_list_item');
						const newIds = Array.from(items)
							.map(el => el.getAttribute("dhx_f_id"))
							.filter(Boolean);
						
						const customIds = customNewsList.map(item => item.id);
						chrome.storage.local.get('newsId', ({newsId}) => {
							const currentIds = Array.isArray(newsId) ? newsId : [];
							const merged = Array.from(new Set([...currentIds, ...newIds, ...customIds]));
							if (JSON.stringify(currentIds) !== JSON.stringify(merged)) {
								chrome.storage.local.set({newsId: merged});
							}
						});
					}

					if (dellNewsField.news === 'true') {
						const selectedNews = Array.isArray(dellNewsField.newsList)
							? dellNewsField.newsList
							: (dellNewsField.newsList ? [dellNewsField.newsList] : []);

						if (selectedNews.includes(id)) {
							node.remove();
						}

						// Inject custom news
						if (parent && customNewsList.length > 0) {
							customNewsList.forEach(item => {
								if (selectedNews.includes(item.id)) {
									const existing = parent.querySelector(`[dhx_f_id="${item.id}"]`);
									if (existing) existing.remove();
									return;
								}

								if (!parent.querySelector(`[dhx_f_id="${item.id}"]`)) {
									const customNode = document.createElement('div');
									customNode.className = 'dhx_list_item dhx_list_news_item delprop-custom-news';
									customNode.setAttribute('dhx_f_id', item.id);
									customNode.style.borderLeft = '4px solid #3b82f6';
									customNode.style.padding = '8px';
									customNode.style.backgroundColor = '#f0f7ff';
									customNode.style.marginBottom = '6px';
									customNode.style.borderRadius = '3px';
									customNode.style.boxSizing = 'border-box';
									
									customNode.innerHTML = `
										<div style="font-weight: bold; color: #1e3a8a; margin-bottom: 4px; font-family: inherit;">📣 ${item.title}</div>
										<div style="font-size: 11px; line-height: 1.4; color: #374151; font-family: inherit;">${item.text}</div>
									`;
									
									parent.prepend(customNode);
								}
							});
						}
					}
					applySemenStyle();
				}

				checkAndClean();
			}
		});
	}

	window.delProp.onCoreReady(initNewsCleaner);
})();
