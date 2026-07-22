const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');
const archiveDest = path.join(distDir, 'archive');

console.log("=== Building Minimal Archive Version ===");

// Clear dist/archive directory
if (fs.existsSync(archiveDest)) {
	fs.rmSync(archiveDest, { recursive: true, force: true });
}
fs.mkdirSync(archiveDest, { recursive: true });

// Obfuscator function that encodes string literals to base64 to hide them from human view,
// while complying with Manifest V3 CSP (no eval() or new Function() at runtime).
function obfuscateJS(code) {
	if (!code.trim()) return code;

	const helperName = '_0x' + Math.random().toString(36).substring(2, 8);
	const helperFn = `function ${helperName}(s){return decodeURIComponent(escape(atob(s)));}\n`;
	
	const stringRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
	
	let hasReplaced = false;
	const obfuscated = code.replace(stringRegex, (match, quote, escape, offset) => {
		const rawString = match.slice(1, -1);
		if (rawString.length === 0) return match;
		if (rawString === 'use strict') return match;

		const remaining = code.substring(offset + match.length).trimStart();
		if (remaining.startsWith(':')) {
			return match;
		}

		try {
			const rawVal = new Function(`return ${match}`)();
			const encoded = Buffer.from(rawVal, 'utf8').toString('base64');
			hasReplaced = true;
			return `${helperName}('${encoded}')`;
		} catch (e) {
			return match;
		}
	});

	return hasReplaced ? (helperFn + obfuscated) : code;
}

// Helper to compile/minify, obfuscate and check integrity of a JS file
function processJS(srcPath, destPath, relativeDest, addIntegrityCheck = false) {
	console.log(`Processing JS: ${srcPath}`);
	const tempDest = destPath + '.tmp.js';
	
	fs.mkdirSync(path.dirname(destPath), { recursive: true });
	
	// Minify first using esbuild (removes comments, whitespace, minifies syntax)
	execSync(`npx -y esbuild "${srcPath}" --minify --outfile="${tempDest}"`, { stdio: 'inherit' });
	
	const minifiedCode = fs.readFileSync(tempDest, 'utf8');
	let finalCode = obfuscateJS(minifiedCode);
	
	if (addIntegrityCheck) {
		const checkCode = `
		;(async () => {
			const crash = () => {
				try { document.documentElement.innerHTML = ''; } catch(e){}
				window.location.href = 'about:blank';
				throw new Error('Security Error');
			};
			try {
				const res = await fetch(chrome.runtime.getURL('${relativeDest.replace(/\\/g, "/")}'));
				const txt = await res.text();
				const marker = 'INTEGRITY_SIGNATURE:';
				const idx = txt.lastIndexOf(marker);
				if (idx === -1) { crash(); return; }
				const embedded = txt.substring(idx + marker.length, idx + marker.length + 32);
				const before = txt.substring(0, idx + marker.length);
				const after = txt.substring(idx + marker.length + 32);
				const clean = before + ' '.repeat(32) + after;
				const cleanForHash = clean.replace(/\r/g, '').replace(/\n/g, '');
				let h = 5381;
				for (let i = 0; i < cleanForHash.length; i++) {
					h = (h * 33) ^ cleanForHash.charCodeAt(i);
				}
				const calculated = (h >>> 0).toString(16).padStart(32, '0').substring(0, 32);
				if (calculated !== embedded) { crash(); return; }
				
				const run = () => {
					${finalCode}
				};
				run();
			} catch (e) {
				crash();
			}
		})();
		// INTEGRITY_SIGNATURE:00000000000000000000000000000000
		`;
		
		let combined = checkCode;
		const marker = 'INTEGRITY_SIGNATURE:';
		const lastIdx = combined.lastIndexOf(marker);
		
		const before = combined.substring(0, lastIdx + marker.length);
		const after = combined.substring(lastIdx + marker.length + 32);
		const cleanCombined = before + ' '.repeat(32) + after;
		const cleanCombinedForHash = cleanCombined.replace(/\r/g, '').replace(/\n/g, '');
		
		let h = 5381;
		for (let i = 0; i < cleanCombinedForHash.length; i++) {
			h = (h * 33) ^ cleanCombinedForHash.charCodeAt(i);
		}
		const finalHash = (h >>> 0).toString(16).padStart(32, '0').substring(0, 32);
		
		combined = combined.replace(/INTEGRITY_SIGNATURE:00000000000000000000000000000000/g, 'INTEGRITY_SIGNATURE:' + finalHash);
		finalCode = combined;
	}
	
	fs.writeFileSync(destPath, finalCode, 'utf8');
	fs.unlinkSync(tempDest);
}

// Helper to minify a CSS file
function processCSS(srcPath, destPath) {
	console.log(`Processing CSS: ${srcPath}`);
	fs.mkdirSync(path.dirname(destPath), { recursive: true });
	execSync(`npx -y esbuild "${srcPath}" --minify --outfile="${destPath}"`, { stdio: 'inherit' });
}

// 1. Process specific source files for minimal Archive version
const jsFiles = [
	['archive/filterHistory.js', 'archive/filterHistory.js', true],
	['archive/filterAutocomplete.js', 'archive/filterAutocomplete.js', true],
	['archive/projectFilter.js', 'archive/projectFilter.js', true],
	['archive/patch.js', 'archive/patch.js', false],
	['background.js', 'background.js', false]
];
jsFiles.forEach(([src, relativeDest, check]) => {
	processJS(path.join(__dirname, src), path.join(archiveDest, relativeDest), relativeDest, check);
});

const cssFiles = [
	['archive/archive.css', 'archive/archive.css'],
	['popup.css', 'popup.css']
];
cssFiles.forEach(([src, relativeDest]) => {
	processCSS(path.join(__dirname, src), path.join(archiveDest, relativeDest));
});

// 2. Create simplified popup.html for Archive version
const archivePopupHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>delProp — Архив Mini</title>
  <link rel="stylesheet" href="popup.css">
  <style>
    body {
      width: 180px;
      min-width: 180px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      background: var(--bg);
      overflow: hidden;
    }
    .app-header {
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="app-header">
    <div class="app-logo">
      <span class="logo-icon">⚡</span>
      <div style="display: flex; flex-direction: column; line-height: 1.1;">
        <span class="logo-text">del<strong>Prop</strong> <small style="font-size: 10px; color: var(--accent);">Archive</small></span>
        <span class="logo-copyright">© <a href="https://r-and-l.ru" target="_blank" class="logo-link">R&L</a></span>
      </div>
    </div>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(archiveDest, 'popup.html'), archivePopupHtml, 'utf8');

// 3. Generate minimal manifest.json for Archive Mini
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const archiveManifest = {
	manifest_version: manifest.manifest_version,
	name: "delProp Archive Mini",
	description: "Фильтр и кэширование электронного архива КБ Вымпел",
	version: manifest.version,
	author: manifest.author,
	content_scripts: [
		{
			matches: ["http://archive.vympel/*"],
			js: [
				"archive/filterHistory.js",
				"archive/filterAutocomplete.js",
				"archive/projectFilter.js"
			],
			css: [
				"archive/archive.css"
			],
			run_at: "document_end"
		}
	],
	background: manifest.background,
	permissions: ["storage", "activeTab", "tabs"],
	action: {
		default_popup: "popup.html",
		default_title: "delProp Archive Mini"
	},
	web_accessible_resources: [
		{
			resources: [
				"archive/patch.js"
			],
			matches: [
				"http://archive.vympel/*"
			]
		}
	]
};
fs.writeFileSync(path.join(archiveDest, 'manifest.json'), JSON.stringify(archiveManifest, null, 2), 'utf8');

console.log("\n=== Minimal Archive Version Build Completed Successfully! ===");
