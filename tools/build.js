// Builds the standalone HTML from the real source files, so app.js / styles.css
// / visual-identity.css / team-branding.css / sports-presentation.css /
// / visual-identity.js / sports-presentation.js / body.html / storage.js /
// portraits/renderer-v1.js stay the single source of truth and the deployable artifact is
// always a byte-for-byte function of them.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
// VERSION.txt holds a bare semver; tolerate the older 'Dynasty Lab v0.0.0'
// spelling so an old checkout still builds.
const version = read('VERSION.txt').trim().replace(/^Dynasty Lab\s*/, '').replace(/^v/, '');

// VERSION.txt is the single source of truth. app.js carries APP_VERSION for the
// status line and the save format, and the header markup carries a placeholder;
// both are reconciled here so a release can never ship three different numbers.
const appVersion = (read('app.js').match(/APP_VERSION='([^']+)'/) || [])[1];
if (!appVersion) throw new Error('APP_VERSION not found in app.js');
if (appVersion !== version)
  throw new Error(`version drift: VERSION.txt says ${version}, app.js APP_VERSION says ${appVersion}`);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<meta name="theme-color" content="#090d12">` +
  `<title>Dynasty Lab v${version}</title><style>` +
  read('styles.css') + '\n' + read('visual-identity.css') + '\n' + read('team-branding.css') + '\n' + read('sports-presentation.css') +
  `</style></head><body>\n` +
  read('body.html').replace(/(<span data-app-version>)[^<]*(<\/span>)/, `$1v${version}$2`) +
  `<script>` + read('portraits/renderer-v1.js') + '\n' + read('storage.js') + '\n' + read('app.js') + '\n' + read('visual-identity.js') + '\n' + read('sports-presentation.js') + `</script></body></html>`;

const out = process.argv[2] || 'index.html';
fs.writeFileSync(path.join(root, out), html);
console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB) from renderer-v1.js + app.js + storage.js + styles.css + visual-identity.css + team-branding.css + sports-presentation.css + body.html + visual-identity.js + sports-presentation.js`);
