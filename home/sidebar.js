(() => {
	window.delProp = window.delProp || {};

	function initSidebarButtonsAndSport() {
		const changeField = window.delProp.settings?.changeField || {};
		const styleField = window.delProp.settings?.styleField || {};
		const btnColors = ["red", "orange", "yellow", "green", "blue", "purple"];

		window.delProp.registerMutationHandler({
			name: 'sidebarCustomizer',
			check: (node) => node && node.classList && node.classList.contains('dhxsidebar_item') && node.childNodes[0]?.innerText === "Разное",
			callback: (node) => {
				chrome.storage.local.get('oldLinks', ({oldLinks = []}) => {
					const btnsOld = document.body.querySelectorAll('.user_link');
					
					if (oldLinks.length !== btnsOld.length) {
						const newLinks = Array.from(btnsOld).map((el, index) => ({
							href: el?.href,
							name: el?.childNodes[1]?.innerText?.replace(/ рабочего|Обучающая платформа /ig, ''),
							id: index + ""
						}));
						chrome.storage.local.set({oldLinks: newLinks});
						oldLinks = newLinks;
					}

					if (changeField.btns === 'true') {
						btnsOld.forEach(el => el.remove());
						
						const box = document.body.querySelector('.dhxsidebar_side_items');
						if (box) {
							box.querySelectorAll('.button').forEach(el => {
								if (el.id !== 'last') el.remove();
							});

							const selectedBtnNames = Array.isArray(changeField.btnName)
								? changeField.btnName
								: (changeField.btnName ? [changeField.btnName] : []);

							oldLinks.forEach((el, index) => {
								if (selectedBtnNames.includes(el.id)) {
									// Avoid duplicates
									if (!Array.from(box.querySelectorAll('.button')).some(btn => btn.textContent === el.name)) {
										const link = document.createElement('a');
										link.className = "button";
										link.href = el.href;
										link.target = "_blank";
										link.textContent = el.name;
										if (index === 0) { link.id = "first"; }
										box.append(link);
									}
								}
							});

							if (styleField.colorized === 'true' && styleField.colorTheme) {
								box.querySelectorAll('.button').forEach(el => {
									el.style.setProperty('--main-color', styleField.colorTheme.mainColor);
									el.style.setProperty('--second-color', styleField.colorTheme.mainColorHover);
								});
							}

							if (changeField.btns_style === 'lgbt') {
								if (!box.querySelector('#last')) {
									const lastLink = document.createElement('a');
									lastLink.className = "button";
									lastLink.href = "#";
									lastLink.textContent = "ТЫК!!!";
									lastLink.id = "last";
									box.append(lastLink);

									setTimeout(() => {
										const lastBtn = document.querySelector('#last');
										if (lastBtn) {
											lastBtn.onclick = (e) => {
												e.preventDefault();
												window.delProp.openModal(chrome.runtime.getURL('img/zhir.png'));
											};
										}
									}, 450);
								}

								const boxButtons = box.querySelectorAll('.button');
								boxButtons.forEach((btn, i) => {
									const color = btnColors[i % btnColors.length];
									btn.style.backgroundColor = color;
									btn.style.borderColor = color;
									if (color === "yellow") {
										btn.style.color = "black";
									} else {
										btn.style.color = "aliceblue";
									}
								});
							}
						}
					}
				});


			}
		});
	}

	function initGalleryAndColorizer() {
		const styleField = window.delProp.settings?.styleField || {};
		const isRndImg = styleField.styled === 'true' && styleField.rndImg === 'on';
		const isColorized = styleField.colorized === 'true';

		if (!isRndImg && !isColorized) return;

		const getGalleryUI = () => {
			let container = document.querySelector('.gallary-container');
			if (container) {
				return {
					container,
					gallary: container.querySelector('.gallary'),
					btnGroup: container.querySelector('.btn-group')
				};
			}

			container = document.createElement('div');
			container.className = 'gallary-container hidden';
			
			const gallary = document.createElement('div');
			gallary.className = 'gallary';
			
			const btnGroup = document.createElement('div');
			btnGroup.className = 'btn-group';
			
			container.appendChild(gallary);
			container.appendChild(btnGroup);
			document.body.appendChild(container);
			
			return { container, gallary, btnGroup };
		};

		if (isRndImg) {
			chrome.storage.local.get('maxSrc', ({ maxSrc }) => {
				let prevImg = [];
				let nextImg = [];
				const max = maxSrc || 20404;

				const openBtn = document.createElement('button');
				openBtn.textContent = 'открыть галерею';
				openBtn.style.cssText = `
					z-index: 40;
					position: absolute;
					bottom: 20px;
					left: 10px;
				`;
				document.body.appendChild(openBtn);

				const { container, gallary, btnGroup } = getGalleryUI();

				const refresh = document.createElement('button');
				const prev = document.createElement('button');
				const next = document.createElement('button');
				refresh.textContent = 'ОБНОВИТЬ';
				prev.textContent = 'НАЗАД';
				next.textContent = 'ВПЕРЕД';

				btnGroup.appendChild(prev);
				btnGroup.appendChild(refresh);
				btnGroup.appendChild(next);

				const setBtnVisible = (elem, visible = false) => {
					elem.disabled = !visible;
					elem.classList.toggle('disabled', !visible);
				};

				setBtnVisible(prev);
				setBtnVisible(next);

				const getSize = () => {
					const h = gallary.offsetHeight - 30;
					const w = gallary.offsetWidth - 30;
					return (w / 250 | 0) * (h / 300 | 0) || 1;
				};

				const getRndSrc = (t) => {
					const min = 4500;
					let srcPool = [];
					for (let i = 0; i < t; i++) {
						srcPool.push(Math.floor(Math.random() * (max - min)) + min);
					}
					return srcPool;
				};

				const addCard = (src) => {
					const card = document.createElement('div');
					card.className = 'card';
					card.innerHTML = `
						<div class="card_content">
							<img src="./kadr/${src}.jpg" alt="${src}">
						</div>
						<div class="card_comment">
							<a href="#" class="comment-link">Комментарии</a>
						</div>
					`;

					const img = card.querySelector('img');
					img.onerror = () => {
						card.remove();
						addCard(getRndSrc(1)[0]);
					};
					img.onclick = () => window.delProp.openModal(`./kadr/${src}.jpg`);

					const commentLink = card.querySelector('.comment-link');
					commentLink.onclick = (e) => {
						e.preventDefault();
						if (typeof window.ShowKadrComments === 'function') {
							window.ShowKadrComments(src);
						}
					};

					gallary.appendChild(card);
				};

				const delCards = () => {
					const size = getSize();
					gallary.querySelectorAll('.card').forEach(child => {
						if (prevImg.length === size) { prevImg = []; }
						prevImg.push(child.querySelector('img').alt);
						child.remove();
					});
				};

				const closeGallary = (e) => {
					if (e.key === "Escape" || e.target === container) {
						container.classList.add('hidden');
						delCards();
						document.removeEventListener('keydown', closeGallary);
						container.removeEventListener('click', closeGallary);
					}
				};

				const openGallary = () => {
					container.classList.remove('hidden');
					const size = getSize();
					getRndSrc(size).forEach(src => addCard(src));

					if (nextImg.length > 0) { nextImg = []; setBtnVisible(next); }
					if (prevImg.length > 0) { setBtnVisible(prev, true); }

					document.addEventListener('keydown', closeGallary);
					container.addEventListener('click', closeGallary);
				};

				openBtn.onclick = (e) => {
					e.preventDefault();
					openGallary();
				};

				refresh.onclick = (e) => {
					e.preventDefault();
					delCards();
					openGallary();
					if (nextImg.length > 0) { nextImg = []; setBtnVisible(next); }
					setBtnVisible(prev, true);
				};

				prev.onclick = (e) => {
					e.preventDefault();
					const size = getSize();
					gallary.querySelectorAll('.card').forEach(child => {
						if (nextImg.length === size) { nextImg = []; }
						nextImg.push(child.querySelector('img').alt);
						child.remove();
					});
					for (let i = 0; i < size; i++) {
						addCard(prevImg[i]);
					}
					setBtnVisible(prev);
					setBtnVisible(next, true);
				};

				next.onclick = (e) => {
					e.preventDefault();
					delCards();
					const size = getSize();
					for (let i = 0; i < size; i++) {
						addCard(nextImg[i]);
					}
					setBtnVisible(next);
					setBtnVisible(prev, true);
				};
			});
		}

		if (isColorized) {
			const { mainColor, mainColorHover } = styleField.colorTheme || {};

			// Исходные цвета портала, которые заменяются на выбранный в попапе цвет.
			// Палитра с ручным тегированием убрана — меняем известные фоновые цвета сайта.
			const mainColors = ['rgb(181, 222, 255)', 'rgb(226, 239, 255)'];
			const mainHoverColors = ['rgb(241, 247, 255)'];

			if (styleField.styled === 'true' && (mainColor || mainColorHover)) {
				for (let sheet of document.styleSheets) {
					try {
						for (let rule of sheet.cssRules) {
							const bg = rule?.style?.backgroundColor;
							if (!bg) continue;
							if (mainColors.includes(bg) && mainColor) {
								rule.style.backgroundColor = mainColor;
							} else if (mainHoverColors.includes(bg) && mainColorHover) {
								rule.style.backgroundColor = mainColorHover;
							}
						}
					} catch (e) {
						// Ignored cross-origin styles
					}
				}
			}
		}
	}

	window.delProp.onCoreReady(() => {
		initSidebarButtonsAndSport();
		initGalleryAndColorizer();
	});
})();
