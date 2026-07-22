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

	function addCloseButton(node, id) {
		if (node.querySelector('.delprop-news-close')) return;

		node.style.position = 'relative';

		const btn = document.createElement('span');
		btn.className = 'delprop-news-close';
		btn.innerHTML = '&times;';
		btn.title = 'Скрыть новость';

		btn.style.position = 'absolute';
		btn.style.top = '4px';
		btn.style.right = '6px';
		btn.style.cursor = 'pointer';
		btn.style.fontSize = '16px';
		btn.style.fontWeight = 'bold';
		btn.style.color = '#9ca3af';
		btn.style.lineHeight = '1';
		btn.style.userSelect = 'none';
		btn.style.transition = 'color 0.2s';

		btn.addEventListener('mouseenter', () => {
			btn.style.color = '#ef4444';
		});
		btn.addEventListener('mouseleave', () => {
			btn.style.color = '#9ca3af';
		});

		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			e.preventDefault();

			chrome.storage.local.get('formFields', ({ formFields }) => {
				formFields = formFields || {};
				formFields.dellNewsField = formFields.dellNewsField || {};

				const currentList = Array.isArray(formFields.dellNewsField.newsList)
					? formFields.dellNewsField.newsList
					: (formFields.dellNewsField.newsList ? [formFields.dellNewsField.newsList] : []);

				if (!currentList.includes(id)) {
					currentList.push(id);
				}

				formFields.dellNewsField.newsList = currentList;

				chrome.storage.local.set({ formFields }, () => {
					node.style.transition = 'opacity 0.3s, max-height 0.3s';
					node.style.opacity = '0';
					setTimeout(() => {
						node.remove();
					}, 300);
				});
			});
		});

		node.appendChild(btn);
	}

	function initNewsCleaner() {
		let customNewsList = [];

		fetch(chrome.runtime.getURL('db/db.json'))
			.then(r => r.json())
			.then(data => {
				customNewsList = data.custom_news || [];
				const newsList = document.querySelector('div[id*="ListObject_"]');
				if (newsList) syncNewsAndCustomNews(newsList);
			})
			.catch(err => console.error("delProp: Error loading custom news:", err));

		if (window.delProp.settings?.styleField?.semen === 'on') {
			setTimeout(applySemenStyle, 300);
			window.addEventListener('resize', applySemenStyle);
			document.addEventListener('click', applySemenStyle);
		}

		function syncNewsAndCustomNews(container) {
			chrome.storage.local.get('formFields', ({ formFields }) => {
				const currentSettings = formFields?.dellNewsField || {};
				const selectedNews = Array.isArray(currentSettings.newsList)
					? currentSettings.newsList
					: (currentSettings.newsList ? [currentSettings.newsList] : []);

				const items = container.querySelectorAll('.dhx_list_item:not(.delprop-custom-news)');

				const newIds = Array.from(items)
					.map(el => el.getAttribute("dhx_f_id"))
					.filter(Boolean);

				const customIds = customNewsList.map(item => item.id);
				chrome.storage.local.get('newsId', ({ newsId }) => {
					const currentIds = Array.isArray(newsId) ? newsId : [];
					const merged = Array.from(new Set([...currentIds, ...newIds, ...customIds]));
					if (JSON.stringify(currentIds) !== JSON.stringify(merged)) {
						chrome.storage.local.set({ newsId: merged });
					}
				});

				items.forEach(node => {
					const id = node.getAttribute("dhx_f_id");
					if (id) {
						if (currentSettings.news === 'true' || selectedNews.includes(id)) {
							node.remove();
						} else {
							addCloseButton(node, id);
						}
					}
				});

				if (customNewsList.length > 0) {
					const latestNews = customNewsList[customNewsList.length - 1];
					if (selectedNews.includes(latestNews.id)) {
						const existing = container.querySelector(`[dhx_f_id="${latestNews.id}"]`);
						if (existing) existing.remove();
					} else {
						let customNode = container.querySelector(`[dhx_f_id="${latestNews.id}"]`);
						if (!customNode) {
							customNode = document.createElement('div');
							customNode.className = 'dhx_list_item dhx_list_news_item delprop-custom-news';
							customNode.setAttribute('dhx_f_id', latestNews.id);
							customNode.style.borderLeft = '4px solid #3b82f6';
							customNode.style.padding = '8px';
							customNode.style.backgroundColor = '#f0f7ff';
							customNode.style.marginBottom = '6px';
							customNode.style.borderRadius = '3px';
							customNode.style.boxSizing = 'border-box';
							customNode.style.position = 'relative';

							customNode.innerHTML = `
								<div style="font-weight: bold; color: #1e3a8a; margin-bottom: 4px; font-family: inherit; padding-right: 20px;">📣 ${latestNews.title}</div>
								<div style="font-size: 13px; line-height: 1.4; color: #374151; font-family: inherit;">${latestNews.text.replace(/\n/g, '<br>')}</div>
							`;

							container.prepend(customNode);
						}

						addCloseButton(customNode, latestNews.id);
					}

					// Remove any older custom news elements that might be lingering
					container.querySelectorAll('.delprop-custom-news').forEach(node => {
						if (node.getAttribute('dhx_f_id') !== latestNews.id) {
							node.remove();
						}
					});
				}

				applySemenStyle();
			});
		}

		window.delProp.registerMutationHandler({
			name: 'newsContainerWatcher',
			checkMutation: (mutation) => {
				const newsList = document.querySelector('div[id*="ListObject_"]');
				if (newsList) {
					syncNewsAndCustomNews(newsList);
				}
			}
		});
	}

	window.delProp.onCoreReady(initNewsCleaner);
})();
