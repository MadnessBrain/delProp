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

		// Fetch custom news from db.json if news removal is enabled
		if (dellNewsField.news === 'true') {
			fetch(chrome.runtime.getURL('db/db.json'))
				.then(r => r.json())
				.then(data => {
					customNewsList = data.custom_news || [];
				})
				.catch(err => console.error("delProp: Error loading custom news:", err));
		}
		
		if (window.delProp.settings?.styleField?.semen === 'on') {
			setTimeout(applySemenStyle, 300);
			window.addEventListener('resize', applySemenStyle);
			document.addEventListener('click', applySemenStyle);
		}

		window.delProp.registerMutationHandler({
			name: 'newsCleaner',
			check: (node) => node && node.classList && node.classList.contains('dhx_list_item'),
			callback: (node) => {
				if (node.className.includes('dhx_list_news_item_selected')) {
					node.className = node.className.split('_selected')[0];
				}
				
				if (node.className.includes('dhx_list_news_item')) {
					const parent = node.parentNode;
					if (parent) {
						// Collect all news item IDs, including custom news items, so they appear in the popup checklist
						const items = parent.querySelectorAll('.dhx_list_item');
						const newIds = Array.from(items)
							.map(el => el.getAttribute("dhx_f_id"))
							.filter(Boolean);
						
						chrome.storage.local.get('newsId', ({newsId}) => {
							if (!newsId || (JSON.stringify(newsId) !== JSON.stringify(newIds) && newsId.length <= newIds.length)) {
								chrome.storage.local.set({newsId: newIds});
							}
						});
					}

					if (dellNewsField.news === 'true') {
						const id = node.getAttribute("dhx_f_id");
						const selectedNews = Array.isArray(dellNewsField.newsList)
							? dellNewsField.newsList
							: (dellNewsField.newsList ? [dellNewsField.newsList] : []);

						// Delete if checked by the user
						if (selectedNews.includes(id)) {
							node.remove();
						}

						// Inject custom news that are not blocked by the user and not already in the DOM
						if (parent && customNewsList.length > 0) {
							customNewsList.forEach(item => {
								if (selectedNews.includes(item.id)) {
									// Ensure we remove it if the user just blocked/deleted it
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
				}
				applySemenStyle();
			}
		});
	}

	window.delProp.onCoreReady(initNewsCleaner);
})();
