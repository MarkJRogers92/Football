const assert = require('assert/strict');
const path = require('path');
const { chromium } = require('playwright-core');
const { chromiumPath } = require('./helpers/chromium-path');
const { startNewDynasty } = require('./helpers/start-new-dynasty');

const FILE = 'file://' + path.join(__dirname, '..', 'index.html');

// v0.13.0: the rising class card on the Recruiting tab.
(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--no-sandbox'] });
  try {
    for (const [label, viewport] of [['desktop', { width: 1280, height: 900 }], ['iphone', { width: 390, height: 844 }]]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(FILE);
      await startNewDynasty(page);
      await page.evaluate(() => document.querySelector('.tabs button[data-tab="recruiting"]').click());
      await page.waitForSelector('#risingClass .rising-row', { timeout: 10000 });

      assert.equal(await page.locator('#risingClass').isVisible(), true, `[${label}] the rising class card is visible`);
      assert.match(await page.locator('#risingClass .eyebrow').innerText(), /NEXT CLASS · 2028/, `[${label}] names next year's class`);
      assert.equal(await page.locator('#risingClass .rising-row').count(), 20, `[${label}] first page is 20 rows`);
      assert.match(await page.locator('.rising-meta').innerText(), /^600 prospects$/, `[${label}] states the class size`);
      assert.equal((await page.locator('.rising-count strong').innerText()).trim(), '0', `[${label}] nobody is watched yet`);

      // Watch and unwatch.
      const first = page.locator('#risingClass [data-rising-watch]').first();
      await first.click();
      await page.waitForFunction(() => document.querySelector('.rising-count strong')?.textContent.trim() === '1');
      assert.equal(await page.locator('#risingClass [data-rising-watch]').first().getAttribute('aria-pressed'), 'true', `[${label}] the button shows Watching`);
      await page.locator('#risingClass [data-rising-watch]').first().click();
      await page.waitForFunction(() => document.querySelector('.rising-count strong')?.textContent.trim() === '0');

      // The watchlist is capped, with a message.
      await page.click('[data-rising-more]');
      await page.waitForFunction(() => document.querySelectorAll('#risingClass .rising-row').length === 40);
      for (let i = 0; i < 15; i++) await page.locator('#risingClass [data-rising-watch][aria-pressed="false"]').first().click();
      await page.waitForFunction(() => document.querySelector('.rising-count strong')?.textContent.trim() === '15');
      await page.locator('#risingClass [data-rising-watch][aria-pressed="false"]').first().click();
      assert.match(await page.locator('.rising-notice').innerText(), /watchlist is full \(15\)/, `[${label}] the sixteenth watch explains itself`);
      assert.equal((await page.locator('.rising-count strong').innerText()).trim(), '15', `[${label}] still 15 watching`);

      // Filters.
      await page.check('[data-rising-only]');
      await page.waitForFunction(() => document.querySelectorAll('#risingClass .rising-row').length === 15);
      assert.match(await page.locator('.rising-meta').innerText(), /^15 of 600 prospects$/, `[${label}] watching-only narrows the list`);
      await page.uncheck('[data-rising-only]');
      await page.selectOption('[data-rising-pos]', 'QB');
      await page.waitForFunction(() => { const rows = [...document.querySelectorAll('#risingClass .rising-who small')]; return rows.length > 0 && rows.every(s => s.textContent.startsWith('QB')); });

      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `[${label}] no horizontal overflow`);
      assert.deepEqual(errors, [], `[${label}] no console errors`);
      await page.close();
    }
    console.log('rising class browser check passed (desktop + iphone)');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
