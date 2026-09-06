// Regression guard for release/version plumbing.
// Builds a temporary standalone page and verifies every user-visible version
// comes from VERSION.txt rather than a stale literal in body.html.
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');
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
  const body = read('body.html');
  const html = fs.readFileSync(outPath, 'utf8');
  const v = escapeRe(version);

  assert.equal(packageVersion, version, 'package.json version must match VERSION.txt');
  assert.equal(appVersion, version, 'APP_VERSION must match VERSION.txt');
  assert.doesNotMatch(body, /data-(?:title-)?version>v\d+\.\d+\.\d+</,
    'body.html must use neutral version placeholders rather than a stale release');
  assert.match(html, new RegExp(`<title>Dynasty Lab v${v}<\\/title>`), 'document title must use VERSION.txt');
  assert.match(html, new RegExp(`data-title-version>v${v}<\\/b>`), 'title-screen label must use VERSION.txt');
  assert.match(html, new RegExp(`data-app-version>v${v}<\\/span>`), 'in-game header label must use VERSION.txt');

  const scoutingActionsAt = html.indexOf('recruitStaffVerdict=recruitScoutingActions.staffVerdict');
  const scoutingReceiptsAt = html.indexOf('function freezeRecruitReceipt');
  assert.ok(scoutingActionsAt >= 0, 'standalone build must contain scouting actions');
  assert.ok(scoutingReceiptsAt >= 0, 'standalone build must contain scouting receipts');
  assert.ok(scoutingActionsAt < scoutingReceiptsAt,
    'standalone build must preserve engine-extension dependency order');

  const extensions = ['scouting-actions.js', 'recruit-compare.js', 'recruiting-shortlist.js', 'scouting-receipts.js', 'development-tendencies.js']
    .map(read).join('\n');
  const noop = () => {};
  const extensionContext = {
    universe: {}, clamp: x => x, avg: () => 0, scoutingDomainView: () => [],
    firstRecruitEvaluation: noop, refreshScoutingIntel: noop, snapshotScouting: noop,
    staffEval: () => 60, scoutHash: () => 0, POS_COUNTS: {}, eligibilityBase: () => 0,
    pipelineStrength: () => 0, recruitDistance: () => 0, renderRecruiting: noop,
    showRecruitProfile: noop, renderRoster: noop, renderDevelopment: noop,
    commitRecruit: noop, finalizeRecruiting: noop, selected: () => null,
    setStatus: noop, attachRecruitLinks: noop, $$: () => [], $: () => null,
    TAB_RENDERERS: {}
  };
  vm.runInNewContext(`(()=>{'use strict';\n${extensions}\n})()`, extensionContext);

  console.log(`version/build plumbing PASS — v${version}, extension order and strict-scope bootstrap are valid`);
} finally {
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
}
