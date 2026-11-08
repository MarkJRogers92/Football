'use strict';
// A long dynasty in a real browser. Not part of the normal matrix: the save is too large to commit.
//
//   node tools/facilities-soak.js with SAVE_OUT=/path/save.json SEASONS=20   (makes the save)
//   LONG_SAVE=/path/save.json node tests/long-save-browser.js                (this test)
//
// Imports the packed save through the app's own file input, saves it to the real IndexedDB slot, loads it back,
// and checks that the Program page, Game Day (with its conditions), the archive and the season pages still work,
// with timings and no console errors, at desktop and phone width.
const assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const {chromium} = require('playwright-core'), {chromiumPath} = require('./helpers/chromium-path'), {startNewDynasty} = require('./helpers/start-new-dynasty'), {clickShellUtility} = require('./helpers/client-shell');
const SAVE = process.env.LONG_SAVE;
if (!SAVE || !fs.existsSync(SAVE)) { console.log('SKIP long-save browser test: set LONG_SAVE to a packed save (see the header).'); process.exit(0); }
const TAB_GROUP = {dashboard: 'home', program: 'program', history: 'world', roster: 'program', season: 'season', gamelab: 'season', stats: 'season', staff: 'program', recruiting: 'recruiting'};
const goTab = (page, id) => page.evaluate(({id, group}) => { const g = document.querySelector(`.tab-groups button[data-group="${group}"]`); if (g && !g.classList.contains('active')) g.click(); document.querySelector(`.tabs button[data-tab="${id}"]`)?.click(); }, {id, group: TAB_GROUP[id]});

(async () => {
  const browser = await chromium.launch({executablePath: chromiumPath(), args: ['--no-sandbox', '--js-flags=--max-old-space-size=6144']});
  const report = {file: path.basename(SAVE), megabytes: +(fs.statSync(SAVE).size / 1048576).toFixed(1)};
  try {
    for (const width of [1280, 390]) {
      const label = width > 700 ? 'desktop' : 'phone';
      const page = await browser.newPage({viewport: {width, height: 900}, acceptDownloads: true, reducedMotion: 'reduce'}), errors = [];
      page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('dialog', d => d.accept());
      const status = (pattern, timeout = 300000) => page.waitForFunction(source => new RegExp(source).test(document.querySelector('#saveStatus')?.textContent || ''), pattern, {timeout});
      await page.goto('file://' + path.join(__dirname, '..', 'index.html')); await startNewDynasty(page);
      const t = {};
      let t0 = Date.now();
      await page.locator('#importFile').setInputFiles(SAVE); await status('^Imported'); t.import = (Date.now() - t0) / 1000;
      t0 = Date.now(); await clickShellUtility(page, '#saveBrowser'); await status('^Saved'); t.save = (Date.now() - t0) / 1000;
      t0 = Date.now(); await clickShellUtility(page, '#loadBrowser'); await status('^Loaded'); t.load = (Date.now() - t0) / 1000;
      const world = await page.evaluate(() => { const u = window.__DL_TEST__.preseasonDebug(), me = window.__DL_TEST__.selected(); return {phase: u.phase, year: document.querySelector('#weekLine')?.textContent, team: me.name, plan: me.facilityPlan ? {levels: me.facilityPlan.levels, fund: me.facilityPlan.fund, goodwill: me.facilityPlan.goodwill} : null}; });
      assert.ok(world.plan && Object.values(world.plan.levels).reduce((a, b) => a + b, 0) >= 10, `[${label}] the facility plan survived: ${JSON.stringify(world.plan)}`);
      assert.match(world.year, /20(4[5-9])/, `[${label}] the year is the end of a long dynasty (${world.year})`);

      // --- Program page: the facilities card renders from the loaded plan.
      t0 = Date.now(); await goTab(page, 'program'); await page.waitForSelector('#facilitiesBoosters .fb-track', {timeout: 60000}); t.programPage = (Date.now() - t0) / 1000;
      assert.equal(await page.locator('#facilitiesBoosters .fb-track').count(), 3);
      assert.match(await page.locator('#facilitiesBoosters').textContent(), /Level|Finished/);
      // --- Game Day: the forecast and the live strip.
      await goTab(page, 'gamelab'); await page.waitForSelector('#v2InteractiveGameDay [data-v2-gameday-start]', {timeout: 60000});
      await page.click('[data-v2-gameday-start]'); await page.waitForSelector('#v2InteractiveGameDay .v2-gameday-conditions', {timeout: 60000});
      for (let i = 0; i < 12; i++) if (await page.locator('[data-v2-gameday-next]').count()) await page.click('[data-v2-gameday-next]');
      const feed = await page.locator('#v2InteractiveGameDay').textContent();
      assert.match(feed, /Game begins|kickoff/i, `[${label}] the live game plays`);
      // --- The archive and history stay reachable and searchable.
      t0 = Date.now(); await goTab(page, 'history'); await page.waitForSelector('#archiveSearch', {timeout: 60000});
      const name = await page.evaluate(() => { const me = window.__DL_TEST__.selected(); return (me.roster[0] || {}).name || ''; });
      await page.fill('#archiveSearch', name.split(' ').pop()); t.history = (Date.now() - t0) / 1000;
      await goTab(page, 'season'); await page.waitForTimeout(500);
      t.heapMB = await page.evaluate(() => Math.round((performance.memory?.usedJSHeapSize || 0) / 1048576));
      assert.deepEqual(errors, [], `[${label}] browser errors: ${errors.slice(0, 3).join(' | ')}`);
      report[label] = {...t, plan: world.plan.levels, goodwill: world.plan.goodwill};
      await page.close();
    }
    console.log('PASS long-save browser: ' + JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exit(1); });
