// Lightweight Electron smoke test for the unpackaged desktop shell.
// The invoking script is responsible for building index.html first.
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { _electron: electron } = require('playwright-core');

const root = path.join(__dirname, '..');
const electronPath = require('electron');

(async () => {
  assert.equal(fs.existsSync(path.join(root, 'index.html')), true, 'built index.html is required');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dynasty-lab-desktop-smoke-'));
  let app;
  const pageErrors = [];
  const consoleErrors = [];
  const launch = () => electron.launch({
    executablePath: electronPath,
    args: [`--user-data-dir=${profile}`, root],
    cwd: root,
  });
  const watchErrors = page => {
    page.on('pageerror', error => pageErrors.push(String(error)));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
  };
  try {
    app = await launch();
    const page = await app.firstWindow();
    watchErrors(page);

    await page.waitForFunction(() => document.querySelector('#titleTeam')?.options.length > 0, { timeout: 60000 });
    assert.match(await page.title(), /Dynasty Lab/i);
    assert.equal(await page.evaluate(() => location.protocol), 'file:');
    assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
    assert.equal(await page.locator('#titleNew').isVisible(), true, 'title screen is visible');

    await page.click('#titleNew');
    await page.locator('#titleStart').waitFor({ state: 'visible', timeout: 10000 });
    await page.click('#titleStart');
    await page.waitForFunction(() => document.querySelector('#userTeam')?.options.length > 0, { timeout: 60000 });
    assert.equal(await page.locator('#app').isVisible(), true, 'new dynasty reaches the application');
    assert.equal(await page.locator('#titleScreen').isVisible(), false, 'title screen closes after starting');
    assert.ok(await page.locator('#userTeam option').count() > 0, 'team selector is populated');
    await page.click('[data-client-tab="roster"]');
    await page.locator('#roster.active').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('#saveBrowser').evaluate(button => button.click());
    await page.waitForFunction(() => /^Saved /.test(document.querySelector('#saveStatus')?.textContent || ''), { timeout: 30000 });

    await app.close();
    app = null;
    app = await launch();
    const restoredPage = await app.firstWindow();
    watchErrors(restoredPage);
    await restoredPage.waitForFunction(() => !document.querySelector('#titleContinue')?.disabled, { timeout: 60000 });
    await restoredPage.click('#titleContinue');
    await restoredPage.locator('#app').waitFor({ state: 'visible', timeout: 30000 });
    assert.match(await restoredPage.locator('#teamName').textContent(), /Chicago Metropolitan/i);
    assert.deepEqual(pageErrors, [], `fatal renderer errors: ${pageErrors.join(' | ')}`);
    assert.deepEqual(consoleErrors, [], `renderer console errors: ${consoleErrors.join(' | ')}`);
    console.log('PASS desktop shell loads local game, navigates, saves, restarts, restores, and closes cleanly');
  } finally {
    if (app) await app.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
