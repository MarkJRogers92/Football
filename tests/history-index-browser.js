const assert = require('assert/strict');
const path = require('path');
const { chromium } = require('playwright-core');
const { chromiumPath } = require('./helpers/chromium-path');
const { startNewDynasty } = require('./helpers/start-new-dynasty');

const FILE = 'file://' + path.join(__dirname, '..', 'index.html');

// v0.12.13: History carries a coach index and the national champion timeline.
(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--no-sandbox'] });
  try {
    for (const [label, viewport] of [['desktop', { width: 1280, height: 900 }], ['iphone', { width: 390, height: 844 }]]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('pageerror', error => errors.push(String(error)));

      await page.goto(FILE);
      await startNewDynasty(page);
      await page.evaluate(() => document.querySelector('.tabs button[data-tab="history"]').click());
      await page.waitForSelector('#historyIndex [data-coach-id]', { timeout: 10000 });
      assert.ok(await page.locator('#historyIndex [data-coach-id]').count() > 10, `[${label}] coaches are listed`);

      const team = await page.evaluate(() => document.querySelector('#userTeam').value);
      await page.fill('#coachIndexSearch', team);
      await page.waitForFunction(() => document.querySelectorAll('#historyIndex [data-coach-id]').length > 0, { timeout: 5000 });
      assert.ok(await page.locator('#historyIndex [data-coach-id]').count() < 40, `[${label}] search narrows the list`);

      await page.locator('#historyIndex [data-coach-id]').first().click();
      await page.waitForFunction(() => document.querySelector('#coachDialog')?.open === true, { timeout: 5000 });
      assert.match(await page.textContent('#coachDialogMeta'), /Age/, `[${label}] the coach profile opens`);
      await page.keyboard.press('Escape');

      assert.match(await page.textContent('#championTimeline'), /Champions appear once a season is archived/, `[${label}] champions explain their empty state`);
      assert.match(await page.textContent('#hallOfFameList'), /No inductees yet/, `[${label}] Hall of Fame explains its empty state`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `[${label}] no horizontal overflow`);
      assert.deepEqual(errors, [], `[${label}] no console errors`);
      await page.close();
    }
    console.log('history index browser check passed (desktop + iphone)');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
