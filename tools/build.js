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
// status line and the save format, and visible version labels are injected from
// VERSION.txt at build time so title/header markup cannot drift across releases.
const appVersion = (read('app.js').match(/APP_VERSION='([^']+)'/) || [])[1];
if (!appVersion) throw new Error('APP_VERSION not found in app.js');
if (appVersion !== version)
  throw new Error(`version drift: VERSION.txt says ${version}, app.js APP_VERSION says ${appVersion}`);

const injectVisibleVersion = (markup, attr) => {
  let matches = 0;
  const re = new RegExp(`(<[^>]*\\b${attr}\\b[^>]*>)[^<]*(<\\/[^>]+>)`, 'g');
  const out = markup.replace(re, (_match, open, close) => {
    matches += 1;
    return `${open}v${version}${close}`;
  });
  if (matches !== 1)
    throw new Error(`expected exactly one ${attr} marker in body.html, found ${matches}`);
  return out;
};

let body = read('body.html');
body = injectVisibleVersion(body, 'data-title-version');
body = injectVisibleVersion(body, 'data-app-version');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
  `<meta http-equiv="Cache-Control" content="no-cache, must-revalidate">
<meta name="viewport" content="width=device-width,initial-scale=1">` +
  `<meta name="theme-color" content="#090d12">` +
  `<title>Dynasty Lab v${version}</title><style>` +
  read('styles.css') + '\n' + read('visual-identity.css') + '\n' + read('team-branding.css') + '\n' + read('sports-presentation.css') + '\n' + read('sports-layout.css') + '\n' + read('recruit-presentation.css') + '\n' + read('polish.css') +
  `</style></head><body>\n` +
  body +
  `<script>` + read('portraits/renderer-v1.js') + '\n' + read('storage.js') + '\n' + read('app.js') + '\n' + read('visual-identity.js') + '\n' + read('sports-presentation.js') + '\n' + read('recruit-presentation.js') + `</script></body></html>`;

const out = process.argv[2] || 'index.html';
fs.writeFileSync(path.join(root, out), html);
console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB) from renderer-v1.js + app.js + storage.js + styles.css + visual-identity.css + team-branding.css + sports-presentation.css + sports-layout.css + recruit-presentation.css + polish.css + body.html + visual-identity.js + sports-presentation.js + recruit-presentation.js`);
