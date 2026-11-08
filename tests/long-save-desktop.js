'use strict';
// A long dynasty in the real desktop shell on a disposable profile. Not part of the normal matrix: the save is
// too large to commit. Needs a display (xvfb-run -a on Linux).
//
//   SEED=7 SEASONS=20 SAVE_OUT=/path/save.json node tools/facilities-soak.js   (makes the save)
//   LONG_SAVE=/path/save.json xvfb-run -a node tests/long-save-desktop.js      (this test)
//
// Imports the packed save, saves it to native storage (chunked archives, the 256 MB core limit), reports what was
// written to disk, quits, relaunches, continues, and checks the facility plan, Game Day and the Program page.
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const {_electron: electron} = require('playwright-core');
const {startNewDynasty} = require('./helpers/start-new-dynasty');
const SAVE = process.env.LONG_SAVE;
if (!SAVE || !fs.existsSync(SAVE)) { console.log('SKIP long-save desktop test: set LONG_SAVE to a packed save (see the header).'); process.exit(0); }
const root = path.join(__dirname, '..'), electronPath = require('electron');
const dirBytes = dir => { let n = 0, files = 0; for (const e of fs.readdirSync(dir, {withFileTypes: true})) { const p = path.join(dir, e.name); if (e.isDirectory()) { const r = dirBytes(p); n += r.bytes; files += r.files; } else { n += fs.statSync(p).size; files++; } } return {bytes: n, files}; };
const mb = n => +(n / 1048576).toFixed(1);
const TAB_GROUP = {program: 'program', gamelab: 'season'};
const goTab = (page, id) => page.evaluate(({id, group}) => { const g = document.querySelector(`.tab-groups button[data-group="${group}"]`); if (g && !g.classList.contains('active')) g.click(); document.querySelector(`.tabs button[data-tab="${id}"]`)?.click(); }, {id, group: TAB_GROUP[id]});

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynasty-lab-long-desktop-')), profile = path.join(dir, 'profile');
  const errors = [], report = {file: path.basename(SAVE), saveMB: mb(fs.statSync(SAVE).size)};
  const launch = () => electron.launch({executablePath: electronPath, args: [`--user-data-dir=${profile}`, root], cwd: root});
  const watch = page => { page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('dialog', d => d.accept()); };
  const status = (page, pattern, timeout = 600000) => page.waitForFunction(source => new RegExp(source).test(document.querySelector('#saveStatus')?.textContent || ''), pattern, {timeout});
  let app;
  try {
    app = await launch();
    let page = await app.firstWindow(); watch(page);
    await page.waitForFunction(() => document.querySelector('#titleTeam')?.options.length > 0, {timeout: 60000});
    await startNewDynasty(page, {beginSeason: false});
    let t0 = Date.now();
    await page.locator('#importFile').setInputFiles(SAVE); await status(page, '^Imported'); report.importSec = (Date.now() - t0) / 1000;
    t0 = Date.now();
    await page.locator('#saveBrowser').evaluate(b => b.click());
    await page.waitForFunction(() => /^(Saved|Could not|Save failed|This save)/.test(document.querySelector('#saveStatus')?.textContent || ''), null, {timeout: 600000});
    report.saveSec = (Date.now() - t0) / 1000;
    const saveText = await page.locator('#saveStatus').textContent();
    assert.match(saveText, /^Saved /, `native save succeeded: ${saveText}`);
    const saves = path.join(profile, 'Saves'), disk = dirBytes(saves);
    report.onDiskMB = mb(disk.bytes); report.files = disk.files;
    const wrapperPath = path.join(saves, 'Dynasty 1', 'dynasty.json');
    assert.ok(fs.existsSync(wrapperPath), 'the save is committed to the profile');
    report.coreMB = mb(fs.statSync(wrapperPath).size);
    assert.ok(fs.statSync(wrapperPath).size < 256 * 1024 * 1024, 'the core stays under the 256 MB limit');
    await app.close();

    app = await launch(); page = await app.firstWindow(); watch(page);
    await page.waitForFunction(() => !document.querySelector('#titleContinue')?.disabled, {timeout: 120000});
    t0 = Date.now(); await page.click('#titleContinue'); await page.locator('#app').waitFor({state: 'visible', timeout: 600000}); report.loadSec = (Date.now() - t0) / 1000;
    const world = await page.evaluate(() => { const me = window.__DL_TEST__.selected(); return {team: me.name, year: document.querySelector('#weekLine')?.textContent, levels: me.facilityPlan?.levels, fund: me.facilityPlan?.fund, goodwill: me.facilityPlan?.goodwill}; });
    assert.match(world.year, /20(4[5-9])/, `the restored dynasty is at the end of a long run (${world.year})`);
    assert.ok(world.levels && Object.values(world.levels).reduce((a, b) => a + b, 0) >= 10, `the facility plan survived the restart: ${JSON.stringify(world)}`);
    await goTab(page, 'program'); await page.waitForSelector('#facilitiesBoosters .fb-track', {timeout: 60000});
    await goTab(page, 'gamelab'); await page.waitForSelector('#v2InteractiveGameDay [data-v2-gameday-start]', {timeout: 60000});
    await page.click('[data-v2-gameday-start]'); await page.waitForSelector('#v2InteractiveGameDay .v2-gameday-conditions', {timeout: 60000});
    // Save again and prove a second commit also works on a large dynasty (the replace-and-backup path).
    t0 = Date.now(); await page.locator('#saveBrowser').evaluate(b => b.click());
    await page.waitForFunction(() => /^(Saved|Could not|Save failed|This save)/.test(document.querySelector('#saveStatus')?.textContent || ''), null, {timeout: 600000});
    report.resaveSec = (Date.now() - t0) / 1000; report.afterResaveMB = mb(dirBytes(path.join(profile, 'Saves')).bytes);
    assert.match(await page.locator('#saveStatus').textContent(), /^Saved /);
    report.plan = world.levels; report.goodwill = world.goodwill;
    assert.deepEqual(errors, [], `renderer errors: ${errors.slice(0, 3).join(' | ')}`);
    console.log('PASS long-save desktop: ' + JSON.stringify(report));
  } finally {
    if (app) await app.close().catch(() => {});
    fs.rmSync(dir, {recursive: true, force: true, maxRetries: 10, retryDelay: 250});
  }
})().catch(err => { console.error(err); process.exit(1); });
