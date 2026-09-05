// Builds the standalone HTML from the real source files, so app.js / styles.css
// / visual-identity.css / team-branding.css / sports-presentation.css / sports-layout.css /
// / recruit-presentation.css / visual-identity.js / sports-presentation.js /
// / recruit-presentation.js / body.html / storage.js / portraits/renderer-v1.js stay
// the single source of truth and the deployable artifact is always a byte-for-byte
// function of them.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
// VERSION.txt holds a bare semver; tolerate the older 'Dynasty Lab v0.0.0'
// spelling so an old checkout still builds.
const version = read('VERSION.txt').trim().replace(/^Dynasty Lab\s*/, '').replace(/^v/, '');

// VERSION.txt is the single source of truth. app.js carries APP_VERSION for the
// status line/save metadata and package.json carries release metadata; fail closed
// if either drifts so a release cannot silently ship multiple version numbers.
const appVersion = (read('app.js').match(/APP_VERSION='([^']+)'/) || [])[1];
if (!appVersion) throw new Error('APP_VERSION not found in app.js');
if (appVersion !== version)
  throw new Error(`version drift: VERSION.txt says ${version}, app.js APP_VERSION says ${appVersion}`);
const packageVersion = JSON.parse(read('package.json')).version;
if (packageVersion !== version)
  throw new Error(`version drift: VERSION.txt says ${version}, package.json says ${packageVersion}`);

// Visible version labels are stamped at build time from VERSION.txt. body.html is
// allowed to contain an old literal because it is a template, but a built release
// is not. Require both markers to exist so a future markup refactor cannot quietly
// drop one of the stamps.
function stampVersionLabel(markup, pattern, label) {
  if (!pattern.test(markup)) throw new Error(`${label} version marker not found in body.html`);
  return markup.replace(pattern, `$1v${version}$2`);
}
let body = read('body.html');
body = stampVersionLabel(body, /(<b data-title-version>)[^<]*(<\/b>)/, 'title-screen');
body = stampVersionLabel(body, /(<span data-app-version>)[^<]*(<\/span>)/, 'app-header');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
  `<meta http-equiv="Cache-Control" content="no-cache, must-revalidate">\n<meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<meta name="theme-color" content="#090d12">` +
  `<title>Dynasty Lab v${version}</title><style>` +
  read('styles.css') + '\n' + read('visual-identity.css') + '\n' + read('team-branding.css') + '\n' + read('sports-presentation.css') + '\n' + read('sports-layout.css') + '\n' + read('recruit-presentation.css') + '\n' + read('polish.css') +
  `</style></head><body>\n` +
  body +
  `<script>` + read('portraits/renderer-v1.js') + '\n' + read('storage.js') + '\n' + read('app.js') + '\n' + read('visual-identity.js') + '\n' + read('sports-presentation.js') + '\n' + read('recruit-presentation.js') + `</script></body></html>`;

const out = process.argv[2] || 'index.html';
fs.writeFileSync(path.join(root, out), html);
console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB) from renderer-v1.js + app.js + storage.js + styles.css + visual-identity.css + team-branding.css + sports-presentation.css + sports-layout.css + recruit-presentation.css + polish.css + body.html + visual-identity.js + sports-presentation.js + recruit-presentation.js`);
