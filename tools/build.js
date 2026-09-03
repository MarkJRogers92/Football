// Builds the standalone HTML from the real source files, so app.js / styles.css
// / body.html / storage.js / portraits/renderer-v1.js stay the single source of truth and the deployable artifact is
// always a byte-for-byte function of them.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const version = read('VERSION.txt').trim().replace(/^Dynasty Lab\s*/, '');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<meta name="theme-color" content="#0e1116">` +
  `<title>Dynasty Lab ${version}</title><style>` +
  read('styles.css') +
  `</style></head><body>\n` +
  read('body.html') +
  `<script>` + read('portraits/renderer-v1.js') + '\n' + read('storage.js') + '\n' + read('app.js') + `</script></body></html>`;

const out = process.argv[2] || 'index.html';
fs.writeFileSync(path.join(root, out), html);
console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB) from renderer-v1.js + app.js + storage.js + styles.css + body.html`);
