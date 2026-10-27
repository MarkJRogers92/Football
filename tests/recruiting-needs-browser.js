const assert = require('assert/strict');
const path = require('path');
const { chromium } = require('playwright-core');
const { chromiumPath } = require('./helpers/chromium-path');
const { startNewDynasty } = require('./helpers/start-new-dynasty');

const FILE = 'file://' + path.join(__dirname, '..', 'index.html');

// Roster needs: the recruiting tab shows thin position groups before signing day.
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
      await page.evaluate(() => document.querySelector('.tabs button[data-tab="recruiting"]').click());
      await page.waitForSelector('#recruitingNeeds [data-need-pos]', { timeout: 10000 });

      assert.equal(await page.locator('#recruitingNeeds').isVisible(), true, `[${label}] the roster needs card is visible`);
      assert.ok(await page.locator('#recruitingNeeds [data-need-pos]').count() > 0, `[${label}] thin position rows render`);
      assert.match(await page.textContent('#recruitingNeedsCount'), /\d+ position group/, `[${label}] the card states a count`);
      const first = await page.locator('#recruitingNeeds [data-need-pos]').first().innerText();
      assert.match(first, /\d+ of \d+/, `[${label}] the row carries counts`);
      assert.match(first, /committed/, `[${label}] the row explains commitments`);

      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `[${label}] no horizontal overflow`);
      assert.deepEqual(errors, [], `[${label}] no console errors`);
      await page.close();
    }
    console.log('recruiting needs browser check passed (desktop + iphone)');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
