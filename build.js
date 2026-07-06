const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');

// Clear dist directory
if (fs.existsSync(distDir)) {
	fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(distDir, 'full'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'archive'), { recursive: true });

// Obfuscator function that encodes string literals to base64 to hide them from human view,
// while complying with Manifest V3 CSP (no eval() or new Function() at runtime).
function obfuscateJS(code) {
	// Skip empty files
	if (!code.trim()) return code;

	const helperName = '_0x' + Math.random().toString(36).substring(2, 8);
	const helperFn = `function ${helperName}(s){return decodeURIComponent(escape(atob(s)));}\n`;
	
	const stringRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
	
	let hasReplaced = false;
	const obfuscated = code.replace(stringRegex, (match, quote, escape, offset) => {
		// Strip outer quotes
		const rawString = match.slice(1, -1);
		if (rawString.length === 0) return match;
		if (rawString === 'use strict') return match;

		// Check what follows the match (ignoring whitespace)
		const remaining = code.substring(offset + match.length).trimStart();
		if (remaining.startsWith(':')) {
			// This is an object key (e.g. { "key": value }), don't obfuscate to avoid syntax errors
			return match;
		}

		try {
			// Evaluate the string literal to get its actual value inside the BUILD script (safe)
			const rawVal = new Function(`return ${match}`)();
			// Base64 encode
			const encoded = Buffer.from(rawVal, 'utf8').toString('base64');
			hasReplaced = true;
			return `${helperName}('${encoded}')`;
		} catch (e) {
			return match;
		}
	});

	return hasReplaced ? (helperFn + obfuscated) : code;
}

// Helper to compile/minify and obfuscate a JS file
function processJS(srcPath, destPath, addIntegrityCheck = false) {
	console.log(`Processing JS: ${srcPath}`);
	const tempDest = destPath + '.tmp.js';
	
	// Ensure destination directory exists
	fs.mkdirSync(path.dirname(destPath), { recursive: true });
	
	// Minify first using esbuild
	execSync(`npx -y esbuild "${srcPath}" --minify --outfile="${tempDest}"`, { stdio: 'inherit' });
	
	// Read minified code and apply custom string obfuscation
	const minifiedCode = fs.readFileSync(tempDest, 'utf8');
	let finalCode = obfuscateJS(minifiedCode);
	
	if (addIntegrityCheck) {
		const wrappedCode = `window.delPropInit = function(key) {
			if (key !== 'INTEGRITY_SIGNATURE:00000000000000000000000000000000'.substring(20)) return;
			${finalCode}
		};`;
		
		const checkCode = `
		;(async () => {
			const crash = () => {
				try { document.documentElement.innerHTML = ''; } catch(e){}
				window.location.href = 'about:blank';
				throw new Error('Security Error');
			};
			try {
				const res = await fetch(chrome.runtime.getURL('archive/saveAddres.js'));
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
				window.delPropInit(calculated);
			} catch (e) {
				crash();
			}
		})();
		// INTEGRITY_SIGNATURE:00000000000000000000000000000000
		`;
		
		let combined = wrappedCode + "\n" + checkCode;
		
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

// Helper to copy a file directly
function copyFile(srcPath, destPath) {
	console.log(`Copying: ${srcPath} -> ${destPath}`);
	fs.mkdirSync(path.dirname(destPath), { recursive: true });
	fs.copyFileSync(srcPath, destPath);
}

// Copy and build Full version
const ignoreList = ['.git', '.agents', 'dist', 'spy', 'build.js', '.gitignore', 'CHANGELOG.md', 'task.md', 'walkthrough.md', 'implementation_plan.md', 'README.md', 'Thumbs.db'];

function copyRecursiveFull(src, dest) {
	const basename = path.basename(src);
	if (ignoreList.includes(basename)) return;

	const stats = fs.statSync(src);
	if (stats.isDirectory()) {
		fs.readdirSync(src).forEach(child => {
			copyRecursiveFull(path.join(src, child), path.join(dest, child));
		});
	} else {
		copyFile(src, dest);
	}
}

console.log("=== Building Full Version ===");
copyRecursiveFull(__dirname, path.join(distDir, 'full'));

// Copy and build Archive-only version
console.log("\n=== Building Archive Version ===");
const archiveDest = path.join(distDir, 'archive');

// 1. Process specific source files for Archive version
const jsFiles = [
	['archive/saveAddres.js', 'archive/saveAddres.js', true],
	['background.js', 'background.js', false]
];
jsFiles.forEach(([src, relativeDest, check]) => {
	processJS(path.join(__dirname, src), path.join(archiveDest, relativeDest), check);
});

const cssFiles = [
	['archive/archive.css', 'archive/archive.css'],
	['popup.css', 'popup.css']
];
cssFiles.forEach(([src, relativeDest]) => {
	processCSS(path.join(__dirname, src), path.join(archiveDest, relativeDest));
});

// 2. Create simplified popup.html for Archive version (only title and copyright)
const archivePopupHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>delProp — Улучшайзер</title>
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
        <span class="logo-text">del<strong>Prop</strong></span>
        <span class="logo-copyright">© <a href="https://r-and-l.ru" target="_blank" class="logo-link">R&L</a></span>
      </div>
    </div>
  </div>
</body>
</html>`;
fs.writeFileSync(path.join(archiveDest, 'popup.html'), archivePopupHtml, 'utf8');
console.log("Created Archive popup.html");

// 3. Generate filtered manifest.json for Archive version
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const archiveManifest = {
	manifest_version: manifest.manifest_version,
	name: "delProp",
	description: "Улучшайзер электронного архива КБ Вымпел",
	version: manifest.version,
	author: manifest.author,
	content_scripts: manifest.content_scripts.filter(cs => 
		cs.matches.some(m => m.includes("archive.vympel"))
	),
	background: manifest.background,
	permissions: ["storage", "activeTab", "tabs"],
	action: {
		default_popup: "popup.html",
		default_title: "delProp"
	}
};
fs.writeFileSync(path.join(archiveDest, 'manifest.json'), JSON.stringify(archiveManifest, null, 2), 'utf8');
console.log("Created Archive manifest.json");

console.log("\n=== Build Completed Successfully! ===");
