// archive/patch.js
document.addEventListener("delPropTrigger", (e) => {
	const { action } = e.detail;
	if (typeof MainTabBar === 'undefined' || typeof GetTabIndexByTabID === 'undefined') return;
	const actvId = MainTabBar.getActiveTab();
	if (!actvId) return;
	const main_tab_id = GetTabIndexByTabID(actvId);
	
	if (action === "copyLinkChat" && typeof CopyLinkToBufferChat === 'function') {
		CopyLinkToBufferChat(parseInt(main_tab_id));
	} else if (action === "copyLinkEmail" && typeof CopyLinkToBufferEmail === 'function') {
		CopyLinkToBufferEmail(parseInt(main_tab_id));
	} else if (action === "copyLinkDirect" && typeof CopyLinkToBuffer === 'function') {
		CopyLinkToBuffer(parseInt(main_tab_id));
	} else if (action === "copyMD5" && typeof CopyMD5toBuffer === 'function') {
		CopyMD5toBuffer();
	} else if (action === "downloadZip" && typeof DownloadZip === 'function' && typeof GetCurrentDocID === 'function' && typeof GetCurrentDocName === 'function') {
		const doc_id = GetCurrentDocID();
		const doc_name = GetCurrentDocName();
		DownloadZip(doc_name, doc_id);
	}
});

document.addEventListener("delPropRequest", (e) => {
	const { action } = e.detail;
	if (action === "getActiveDoc") {
		const tryGet = () => {
			try {
				if (typeof GetCurrentDocID !== 'function' || typeof GetCurrentDocName !== 'function') return '';
				const doc_id = GetCurrentDocID();
				const doc_name = GetCurrentDocName();
				
				const actvTab = document.querySelector('.dhxtabbar_tab.dhxtabbar_tab_actv');
				let tabName = '';
				if (actvTab) {
					const child = actvTab.childNodes[0];
					tabName = (child ? (child.innerText || child.textContent) : (actvTab.innerText || actvTab.textContent)) || '';
					tabName = tabName.trim();
				}
				
				document.dispatchEvent(new CustomEvent("delPropResponse", {
					detail: { action: "activeDoc", doc_id, doc_name, tabName }
				}));
				return doc_id;
			} catch (err) {
				console.error("delProp error in page context:", err);
			}
			return '';
		};

		// Try immediately
		const id = tryGet();
		if (!id) {
			// Retry after 100ms and 300ms if not ready yet
			setTimeout(tryGet, 100);
			setTimeout(tryGet, 300);
		}
	}
});
