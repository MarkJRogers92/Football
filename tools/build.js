// Builds the standalone HTML from the real source files. Engine extensions are injected immediately
// before app.js bootstraps so they share its closure without turning the 460KB core into a merge hotspot.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const version = read('VERSION.txt').trim().replace(/^Dynasty Lab\s*/, '').replace(/^v/, '');
const baseAppSource=read('app.js');
const engineExtensionFiles=['staff-scouting-core.js','scouting-actions.js','scouting-trail.js','recruiting-filters.js','recruit-compare.js','recruiting-shortlist.js','scouting-receipts.js','staff-scouting-ui.js','recruiting-history.js','development-tendencies.js','recruiting-battles.js','development-plans.js'];
const engineExtensionAnchor='loadSchools().then(';
const engineExtensionAt=baseAppSource.lastIndexOf(engineExtensionAnchor);
if(engineExtensionAt<0)throw new Error('engine extension anchor not found');
// Preserve dependency order: later extensions use helpers exported by earlier ones.
const engineExtensionSource=engineExtensionFiles.map(read).join('\n');
const appSource=baseAppSource.slice(0,engineExtensionAt)+engineExtensionSource+'\n'+baseAppSource.slice(engineExtensionAt);
const appVersion = (baseAppSource.match(/APP_VERSION='([^']+)'/) || [])[1];
if (!appVersion) throw new Error('APP_VERSION not found in app.js');
if (appVersion !== version) throw new Error(`version drift: VERSION.txt says ${version}, app.js APP_VERSION says ${appVersion}`);
const packageVersion = JSON.parse(read('package.json')).version;
if (packageVersion !== version) throw new Error(`version drift: VERSION.txt says ${version}, package.json says ${packageVersion}`);
function stampVersionLabel(markup, pattern, label) {if (!pattern.test(markup)) throw new Error(`${label} version marker not found in body.html`);return markup.replace(pattern, `$1v${version}$2`)}
let body = read('body.html');
body = stampVersionLabel(body, /(<b data-title-version>)[^<]*(<\/b>)/, 'title-screen');
body = stampVersionLabel(body, /(<span data-app-version>)[^<]*(<\/span>)/, 'app-header');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
  `<meta http-equiv="Cache-Control" content="no-cache, must-revalidate">\n<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#090d12"><title>Dynasty Lab v${version}</title><style>` +
  read('styles.css')+'\n'+read('visual-identity.css')+'\n'+read('team-branding.css')+'\n'+read('conference-branding.css')+'\n'+read('sports-presentation.css')+'\n'+read('sports-layout.css')+'\n'+read('recruit-presentation.css')+'\n'+read('scouting-actions.css')+'\n'+read('staff-scouting.css')+'\n'+read('scouting-trail.css')+'\n'+read('recruiting-filters.css')+'\n'+read('recruit-compare.css')+'\n'+read('recruiting-shortlist.css')+'\n'+read('scouting-receipts.css')+'\n'+read('recruiting-history.css')+'\n'+read('development-tendencies.css')+'\n'+read('recruiting-battles.css')+'\n'+read('development-plans.css')+'\n'+read('polish.css')+
  `</style></head><body>\n`+body+`<script>`+read('portraits/renderer-v1.js')+'\n'+read('storage.js')+'\n'+read('rng.js')+'\n'+read('game-engine-v2.js')+'\n'+read('game-engine-v2-adapter.js')+'\n'+read('escape.js')+'\n'+appSource+'\n'+read('program-branding.js')+'\n'+read('conference-branding.js')+'\n'+read('visual-identity.js')+'\n'+read('sports-presentation.js')+'\n'+read('recruit-presentation.js')+'\n'+read('next-action.js')+'\n'+read('team-logo-coverage.js')+'\n'+read('program-color-coverage.js')+`</script></body></html>`;
const out = process.argv[2] || 'index.html';fs.writeFileSync(path.join(root, out), html);console.log(`built ${out} (${(html.length / 1024).toFixed(0)} KB) with Game Engine 2 foundation and shadow adapter, scouting, staff evaluation identity, evaluation trail, recruiting filters, recruit compare, staff shortlist, delayed scouting receipts, recruiting history, recruiting battles, observed development tendencies and featured development plans`);
