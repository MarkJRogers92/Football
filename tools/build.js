// Builds the standalone HTML from the real source files, so app.js / styles.css
// / visual-identity.css / team-branding.css / sports-presentation.css / sports-layout.css /
// / recruit-presentation.css / scouting-actions.css / recruit-compare.css / conference-branding.css /
// / program-branding.js / visual-identity.js / sports-presentation.js / recruit-presentation.js /
// / next-action.js / scouting-actions.js / recruit-compare.js / team-logo-coverage.js /
// / program-color-coverage.js / body.html / storage.js / rng.js / escape.js /
// / portraits/renderer-v1.js stay the single source of truth and the deployable artifact is always
// a byte-for-byte function of them.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const version = read('VERSION.txt').trim().replace(/^Dynasty Lab\s*/, '').replace(/^v/, '');

const baseAppSource=read('app.js');
function injectEngineExtension(src,file){
  const anchor='loadSchools().then(';
  const at=src.lastIndexOf(anchor);
  if(at<0)throw new Error(`engine extension anchor not found while adding ${file}`);
  return src.slice(0,at)+read(file)+'\n'+src.slice(at);
}
let appSource=baseAppSource;
for(const file of ['scouting-actions.js','recruit-compare.js'])appSource=injectEngineExtension(appSource,file);

const appVersion = (baseAppSource.match(/APP_VERSION='([^']+)'/) || [])[1];
if (!appVersion) throw new Error('APP_VERSION not found in app.js');
if (appVersion !== version)
  throw new Error(`version drift: VERSION.txt says ${version}, app.js APP_VERSION says ${appVersion}`);
const packageVersion = JSON.parse(read('package.json')).version;
if (packageVersion !== version)
  throw new Error(`version drift: VERSION.txt says ${version}, package.json says ${packageVersion}`);

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
  read('styles.css') + '\n' + read('visual-identity.css') + '\n' + read('team-branding.css') + '\n' + read('conference-branding.css') + '\n' + read('sports-presentation.css') + '\n' + read('sports-layout.css') + '\n' + read('recruit-presentation.css') + '\n' + read('scouting-actions.css') + '\n' + read('recruit-compare.css') + '\n' + read('polish.css') +
  `</style></head><body>\n` +
  body +
  `<script>` + read('portraits/renderer-v1.js') + '\n' + read('storage.js') + '\n' + read('rng.js') + '\n' + read('escape.js') + '\n' + appSource + '\n' + read('program-branding.js') + '\n' + read('conference-branding.js') + '\n' + read('visual-identity.js') + '\n' + read('sports-presentation.js') + '\n' + read('recruit-presentation.js') + '\n' + read('next-action.js') + '\n' + read('team-logo-coverage.js') + '\n' + read('program-color-coverage.js') + `</script></body></html>`;

const out = process.argv[2] || 'index.html';
fs.writeFileSync(path.join(root, out), html);
console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB) with scouting/recruit-compare engine extensions plus next-action.js and presentation assets`);
