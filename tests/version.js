// Regression guard for release/version plumbing.
// Builds a temporary standalone page and verifies every user-visible version
// comes from VERSION.txt rather than a stale literal in body.html.
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const outName = '.version-test-index.html';
const outPath = path.join(root, outName);
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

try {
  execFileSync(process.execPath, [path.join(root, 'tools/build.js'), outName], {
    cwd: root,
    stdio: 'pipe'
  });

  const version = read('VERSION.txt').trim().replace(/^Dynasty Lab\s*/, '').replace(/^v/, '');
  const packageVersion = JSON.parse(read('package.json')).version;
  const appVersion = (read('app.js').match(/APP_VERSION='([^']+)'/) || [])[1];
  const html = fs.readFileSync(outPath, 'utf8');
  const v = escapeRe(version);

  assert.equal(packageVersion, version, 'package.json version must match VERSION.txt');
  assert.equal(appVersion, version, 'APP_VERSION must match VERSION.txt');
  assert.match(html, new RegExp(`<title>Dynasty Lab v${v}<\\/title>`), 'document title must use VERSION.txt');
  assert.match(html, new RegExp(`data-title-version>v${v}<\\/b>`), 'title-screen label must use VERSION.txt');
  assert.match(html, new RegExp(`data-app-version>v${v}<\\/span>`), 'in-game header label must use VERSION.txt');

  console.log(`version plumbing PASS — all visible labels are v${version}`);
} finally {
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
}
