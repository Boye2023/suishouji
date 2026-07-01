// ============================================================
// build.js — Inline all assets into dist/index.html
// Run: node build.js
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// 1. Read index.html
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// 2. Read and inline CSS
const cssFiles = ['css/main.css', 'css/animations.css'];
let allCSS = '';
for (const file of cssFiles) {
  const filePath = path.join(ROOT, file);
  if (fs.existsSync(filePath)) {
    allCSS += fs.readFileSync(filePath, 'utf8') + '\n';
  }
}
html = html.replace(
  /<link rel="stylesheet" href="css\/main\.css">\s*<link rel="stylesheet" href="css\/animations\.css">/,
  `<style>${allCSS}</style>`
);

// 3. Concatenate JS files in order
const jsFiles = [
  'js/utils.js',
  'js/db.js',
  'js/state.js',
  'js/ai.js',
  'js/components/calendar-strip.js',
  'js/components/search-bar.js',
  'js/components/voice-recorder.js',
  'js/components/image-uploader.js',
  'js/components/note-card.js',
  'js/components/timeline.js',
  'js/components/tab-bar.js',
  'js/components/charts.js',
  'js/pages/home.js',
  'js/pages/memory-bank.js',
  'js/pages/profile.js',
  'js/app.js'
];

let allJS = '';
for (const file of jsFiles) {
  const filePath = path.join(ROOT, file);
  if (fs.existsSync(filePath)) {
    allJS += `\n// ====== ${file} ======\n`;
    allJS += fs.readFileSync(filePath, 'utf8') + '\n';
  } else {
    console.warn(`WARNING: ${file} not found`);
  }
}

// 4. Replace all script tags with single inline script
html = html.replace(
  /<script src="js\/utils\.js"><\/script>\s*<script src="js\/db\.js"><\/script>\s*<script src="js\/state\.js"><\/script>\s*<script src="js\/ai\.js"><\/script>\s*<script src="js\/components\/calendar-strip\.js"><\/script>\s*<script src="js\/components\/search-bar\.js"><\/script>\s*<script src="js\/components\/voice-recorder\.js"><\/script>\s*<script src="js\/components\/image-uploader\.js"><\/script>\s*<script src="js\/components\/note-card\.js"><\/script>\s*<script src="js\/components\/timeline\.js"><\/script>\s*<script src="js\/components\/tab-bar\.js"><\/script>\s*<script src="js\/components\/charts\.js"><\/script>\s*<script src="js\/pages\/home\.js"><\/script>\s*<script src="js\/pages\/memory-bank\.js"><\/script>\s*<script src="js\/pages\/profile\.js"><\/script>\s*<script src="js\/app\.js"><\/script>/,
  `<script>${allJS}</script>`
);

// 5. Copy manifest.json to dist
const manifestSrc = path.join(ROOT, 'manifest.json');
if (fs.existsSync(manifestSrc)) {
  fs.copyFileSync(manifestSrc, path.join(DIST, 'manifest.json'));
}

// 6. Copy sw.js to dist
const swSrc = path.join(ROOT, 'sw.js');
if (fs.existsSync(swSrc)) {
  fs.copyFileSync(swSrc, path.join(DIST, 'sw.js'));
}

// 7. Write output
const outputPath = path.join(DIST, 'index.html');
fs.writeFileSync(outputPath, html, 'utf8');

const stats = fs.statSync(outputPath);
console.log(`✅ Build complete: dist/index.html (${(stats.size / 1024).toFixed(1)} KB)`);
console.log(`   ${cssFiles.length} CSS files inlined`);
console.log(`   ${jsFiles.length} JS files bundled`);
