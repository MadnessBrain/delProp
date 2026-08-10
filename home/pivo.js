// home/pivo.js — entry point for pivo timer widget
// Loads sub-modules from home/pivo/ and boots the timer when ready
(() => {
	window.delProp = window.delProp || {};
	window.delProp.pivo = window.delProp.pivo || {};

	function initPivo() {
		if (window.self !== window.top) return;

		const formFields = window.delProp.settings;
		const user = window.delProp.user;
		if (!formFields || !formFields.workTimerField) return;

		const { timer: timerOpt, timerTheme = 'beer' } = formFields.workTimerField;
		if (timerOpt !== 'true') return;
		if (!document.body) return;

		// Build DOM: shadow host + link to CSS + theme HTML from themes.js
		const host = document.createElement('div');
		host.id = 'pivo';
		host.style.cssText = `
			position: fixed;
			bottom: 0;
			right: 6px;
			height: 340px;
			width: 160px;
			display: block;
			z-index: 2147483647;
			pointer-events: none;
		`;
		const shadow = host.attachShadow({ mode: 'open' });
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = chrome.runtime.getURL('home/pivo.css');

		const inner = document.createElement('div');
		inner.innerHTML = window.delProp.pivo.buildThemeHtml(timerTheme);

		shadow.appendChild(link);
		shadow.appendChild(inner);
		document.documentElement.append(host);

		// Start the core engine
		window.delProp.pivo.start({
			theme: timerTheme,
			workTimerField: formFields.workTimerField,
			user: user
		});
	}

	window.delProp.onCoreReady(initPivo);
})();
