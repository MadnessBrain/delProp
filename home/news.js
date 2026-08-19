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

	// Built-in image sources. Each is a URL that returns an image DIRECTLY.
	// {random} -> random string (cache-bust), {n} -> random integer 0..99999.
	const IMAGE_SOURCES = {
		anime:  ['https://www.thiswaifudoesnotexist.net/example-{n}.jpg'],
		cats:   ['https://cataas.com/cat?_={random}'],
		photos: ['https://loremflickr.com/600/400?_={random}'],
		bears:  ['https://placebear.com/600/400?_={random}']
	};

	function fillRandom(url) {
		return String(url)
			.replace(/\{random\}/gi, Date.now() + '_' + Math.floor(Math.random() * 1e6))
			.replace(/\{n\}/gi, Math.floor(Math.random() * 100000));
	}

	// Picks a direct-image URL for the chosen filter (built-in or user's custom list).
	function resolveImageUrl(settings) {
		const filter = settings.imageFilter || 'cats';
		let templates;
		if (filter === 'custom') {
			templates = String(settings.customImageUrls || '')
				.split(/[\n,]+/)
				.map(s => s.trim())
				.filter(s => /^https?:\/\//i.test(s));
		} else {
			templates = IMAGE_SOURCES[filter] || IMAGE_SOURCES.cats;
		}
		if (!templates.length) return null;
		const tpl = templates[Math.floor(Math.random() * templates.length)];
		return fillRandom(tpl);
	}

	// Loads a fresh image into the <img>, or shows a hint if no source is configured.
	function loadImageInto(img, hint, settings) {
		const url = resolveImageUrl(settings);
		if (!url) {
			img.removeAttribute('src');
			img.style.display = 'none';
			hint.style.display = 'block';
			return;
		}
		hint.style.display = 'none';
		img.style.display = 'block';
		img.style.opacity = '0.4';
		img.onload = () => { img.style.opacity = '1'; };
		img.onerror = () => {
			img.style.opacity = '1';
			img.style.display = 'none';
			hint.textContent = 'Не удалось загрузить картинку (источник недоступен или заблокирован)';
			hint.style.display = 'block';
		};
		img.src = url;
	}

	// Injects a "picture instead of news" card, mirroring the custom-news card logic.
	function createImageCard(container, settings) {
		const card = document.createElement('div');
		card.className = 'dhx_list_item dhx_list_news_item delprop-image-news';
		card.style.cssText = 'border-left:4px solid #ec4899;padding:8px;background-color:#fff0f7;margin-bottom:6px;border-radius:3px;box-sizing:border-box;position:relative;text-align:center;';
		card.innerHTML = `
			<div style="font-weight:bold;color:#9d174d;margin-bottom:6px;font-family:inherit;">🖼️ Картинка дня</div>
			<img class="delprop-image-img" alt="картинка" style="max-width:100%;border-radius:4px;display:block;margin:0 auto;min-height:40px;cursor:pointer;">
			<div class="delprop-image-hint" style="display:none;font-size:12px;color:#9d174d;font-family:inherit;padding:6px;">Источник картинок не задан. Выберите категорию или добавьте свои адреса в настройках.</div>
			<button type="button" class="delprop-image-refresh" style="margin-top:6px;cursor:pointer;font-family:inherit;font-size:12px;padding:3px 10px;border:1px solid #ec4899;background:#fff;color:#9d174d;border-radius:4px;">🔄 ещё</button>
		`;
		container.prepend(card);

		const img = card.querySelector('.delprop-image-img');
		const hint = card.querySelector('.delprop-image-hint');
		const btn = card.querySelector('.delprop-image-refresh');

		img.addEventListener('click', () => {
			if (img.src) window.delProp.openModal(img.src);
		});
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			loadImageInto(img, hint, settings);
		});

		loadImageInto(img, hint, settings);
		return card;
	}

	function syncImageCard(container, settings) {
		const enabled = settings.news === 'true' && settings.showImages === 'true';
		const existing = container.querySelector('.delprop-image-news');
		if (enabled) {
			if (!existing) createImageCard(container, settings);
		} else if (existing) {
			existing.remove();
		}
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
				syncImageCard(container, currentSettings);
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
