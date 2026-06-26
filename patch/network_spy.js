// Network Interceptor for delProp
(() => {
	console.log("delProp: Network Spy injected into page context.");

	// Intercept fetch
	if (window.fetch) {
		const originalFetch = window.fetch;
		window.fetch = async function(...args) {
			const response = await originalFetch(...args);
			const clone = response.clone();
			try {
				const text = await clone.text();
				document.dispatchEvent(new CustomEvent('delPropNetSpy', {
					detail: {
						type: 'fetch',
						url: args[0],
						method: args[1]?.method || 'GET',
						requestBody: args[1]?.body || null,
						response: text,
						timestamp: new Date().toISOString()
					}
				}));
			} catch (e) {
				console.error("delProp NetSpy fetch clone error:", e);
			}
			return response;
		};
	}

	// Intercept XMLHttpRequest
	if (window.XMLHttpRequest) {
		const originalOpen = XMLHttpRequest.prototype.open;
		const originalSend = XMLHttpRequest.prototype.send;

		XMLHttpRequest.prototype.open = function(method, url) {
			this._url = url;
			this._method = method;
			return originalOpen.apply(this, arguments);
		};

		XMLHttpRequest.prototype.send = function(body) {
			this.addEventListener('load', function() {
				try {
					document.dispatchEvent(new CustomEvent('delPropNetSpy', {
						detail: {
							type: 'xhr',
							url: this._url,
							method: this._method,
							requestBody: body || null,
							response: this.responseText,
							timestamp: new Date().toISOString()
						}
					}));
				} catch (e) {
					console.error("delProp NetSpy XHR capture error:", e);
				}
			});
			return originalSend.apply(this, arguments);
		};
	}
})();
