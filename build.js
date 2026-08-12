const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generate } = require('./gen-manifest');

const distDir = path.join(__dirname, 'dist');
const fullDest = path.join(distDir, 'full');

console.log("=== Building Full Version ===");

// Генерируем manifest.json и hosts.generated.js из шаблона + hosts.json перед сборкой
generate(__dirname);

// Clear dist/full directory
if (fs.existsSync(fullDest)) {
	fs.rmSync(fullDest, { recursive: true, force: true });
}
fs.mkdirSync(fullDest, { recursive: true });

// Helper to minify a JS file using esbuild (strips comments, whitespace, minifies syntax)
function minifyJS(srcPath, destPath) {
	console.log(`Minifying JS: ${srcPath} -> ${destPath}`);
	fs.mkdirSync(path.dirname(destPath), { recursive: true });
	execSync(`npx -y esbuild "${srcPath}" --minify --outfile="${destPath}"`, { stdio: 'inherit' });
}

// Helper to minify a CSS file using esbuild
function minifyCSS(srcPath, destPath) {
	console.log(`Minifying CSS: ${srcPath} -> ${destPath}`);
	fs.mkdirSync(path.dirname(destPath), { recursive: true });
	execSync(`npx -y esbuild "${srcPath}" --minify --outfile="${destPath}"`, { stdio: 'inherit' });
}

// Helper to copy a file directly
function copyFile(srcPath, destPath) {
	console.log(`Copying file: ${srcPath} -> ${destPath}`);
	fs.mkdirSync(path.dirname(destPath), { recursive: true });
	fs.copyFileSync(srcPath, destPath);
}

const ignoreList = [
	'.git', '.agents', 'dist', 'spy', 'build.js', '.gitignore', '.gitattributes',
	'CHANGELOG.md', 'task.md', 'walkthrough.md', 'implementation_plan.md', 'README.md',
	'Thumbs.db', 'node_modules', 'package.json', 'package-lock.json',
	'gen-manifest.js', 'manifest.template.json', 'hosts.json', 'hosts.example.json',
	'.env', '.env.local', '.env.example'
];

function buildRecursive(src, dest) {
	const basename = path.basename(src);
	if (ignoreList.includes(basename)) return;

	const stats = fs.statSync(src);
	if (stats.isDirectory()) {
		fs.readdirSync(src).forEach(child => {
			buildRecursive(path.join(src, child), path.join(dest, child));
		});
	} else {
		if (src.endsWith('.js')) {
			if (basename.includes('xlsx.full.min')) {
				copyFile(src, dest);
			} else {
				minifyJS(src, dest);
			}
		} else if (src.endsWith('.css')) {
			minifyCSS(src, dest);
		} else {
			copyFile(src, dest);
		}
	}
}

buildRecursive(__dirname, fullDest);

console.log("\n=== Full Version Build Completed Successfully! ===");
