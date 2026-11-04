const assert = require('assert/strict');
const path = require('path');
const { chromium } = require('playwright-core');
const { chromiumPath } = require('./helpers/chromium-path');
const { startNewDynasty } = require('./helpers/start-new-dynasty');

const FILE = 'file://' + path.join(__dirname, '..', 'index.html');
const tab = (page, id) => page.evaluate(t => document.querySelector(`.tabs button[data-tab="${t}"]`).click(), id);

// v0.13.1: findings from a playthrough review. Game Lab's actions are gated on the week's Coach's
// Desk decisions and now say so; the Development training table folds; routine "Decision recorded"
// messages stay out of the headline ticker.
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

      // 1. Game Lab explains its dead buttons and offers the jump.
      // A week is gated only by Coach's Desk decisions other than the weekly game plan, and about
      // a third of fresh dynasties open without one. The note must be visible exactly when the week
      // is gated; if this universe opens ungated, sim forward until a gated week so the gated path
      // is always exercised.
      let gated = false;
      for (let hop = 0; hop < 8; hop++) {
        await tab(page, 'dashboard');
        gated = await page.$eval('#simWeek', el => el.disabled);
        await tab(page, 'gamelab');
        await page.waitForFunction(g => document.querySelector('#detailedGateNote')?.hidden === !g, gated, { timeout: 10000 });
        assert.equal(await page.locator('#watchDetailedGame').isDisabled(), gated, `[${label}] week ${hop}: Watch is disabled exactly when the week is gated`);
        if (gated) break;
        await tab(page, 'dashboard');
        const before = await page.evaluate(() => document.querySelector('#weekLine')?.textContent);
        await page.click('#simWeek');
        await page.waitForFunction(w => document.querySelector('#weekLine')?.textContent !== w, before, { timeout: 60000 });
      }
      assert.ok(gated, `[${label}] reached a gated week within eight weeks`);
      await page.waitForSelector('#detailedGateNote:not([hidden])', { timeout: 10000 });
      assert.match(await page.locator('#detailedGateNote').innerText(), /Resolve the Coach’s Desk decisions before playing this week\./, `[${label}] the gate states its reason`);
      assert.equal(await page.locator('#watchDetailedGame').isDisabled(), true, `[${label}] watch is gated`);
      assert.match(await page.locator('#watchDetailedGame').getAttribute('title'), /Coach’s Desk/, `[${label}] the disabled button carries the reason as a tooltip`);
      assert.doesNotMatch(await page.locator('#gamelab .section-head').first().innerText(), /drive\/play engine|fast-sims/, `[${label}] intro is plain language`);
      await page.click('#detailedGateNote .gate-note-go');
      await page.waitForFunction(() => document.querySelector('#dashboard')?.classList.contains('active'));
      for (let guard = 0; guard < 12 && await page.$eval('#simWeek', el => el.disabled); guard++) {
        const resolved = await page.evaluate(() => {
          const b = [...document.querySelectorAll('[data-decision][data-choice]')].find(el => !el.disabled && el.offsetParent !== null);
          if (!b) return false; b.click(); return true;
        });
        if (!resolved) break;
        await page.waitForTimeout(80);
      }
      await tab(page, 'gamelab');
      await page.waitForFunction(() => document.querySelector('#detailedGateNote')?.hidden === true, null, { timeout: 10000 });
      assert.equal(await page.locator('#watchDetailedGame').isDisabled(), false, `[${label}] watch unlocks once decisions are made`);
      assert.equal(await page.locator('#watchDetailedGame').getAttribute('title'), null, `[${label}] the tooltip clears with the gate`);

      // Internal milestone labels ("V0.10.1 ...") never reach the player.
      for (const id of ['gamelab', 'dashboard']) {
        await tab(page, id);
        assert.doesNotMatch(await page.locator('#' + id).innerText(), /\bv\d+\.\d+(\.\d+)?\b/i, `[${label}] no version label leaks into the ${id} tab`);
      }

      // 2. The Development training table folds.
      await tab(page, 'development');
      await page.waitForSelector('#trainingBody tr', { timeout: 10000 });
      const total = await page.locator('#trainingBody tr').count();
      assert.ok(total > 40, `[${label}] the training table still holds every player (${total})`);
      const visible = () => page.locator('#trainingBody tr:not([hidden])').count();
      assert.equal(await visible(), 12, `[${label}] twelve training rows show by default`);
      assert.match(await page.locator('[data-fold-toggle="#trainingBody"]').innerText(), new RegExp(`^Show all ${total} players$`), `[${label}] the toggle names the count`);
      const folded = await page.evaluate(() => document.documentElement.scrollHeight);
      assert.ok(folded < (label === 'iphone' ? 9000 : 5500), `[${label}] Development page is shorter when folded (${folded}px)`);
      await page.click('[data-fold-toggle="#trainingBody"]');
      await page.waitForFunction(n => document.querySelectorAll('#trainingBody tr:not([hidden])').length === n, total);
      assert.match(await page.locator('[data-fold-toggle="#trainingBody"]').innerText(), /^Show fewer players$/, `[${label}] the toggle flips`);
      await page.click('[data-fold-toggle="#trainingBody"]');
      await page.waitForFunction(() => document.querySelectorAll('#trainingBody tr:not([hidden])').length === 12);

      // 3. Routine decision confirmations are not ticker headlines.
      const ticker = await page.evaluate(() => document.querySelector('.hud-ticker')?.innerText || '');
      assert.doesNotMatch(ticker, /Decision recorded:/, `[${label}] the ticker skips routine decision confirmations`);

      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `[${label}] no horizontal overflow`);
      assert.deepEqual(errors, [], `[${label}] no console errors`);
      await page.close();
    }
    console.log('review polish browser check passed (desktop + iphone)');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
