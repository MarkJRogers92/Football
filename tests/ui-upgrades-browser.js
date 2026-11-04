const assert = require('assert/strict');
const path = require('path');
const { chromium } = require('playwright-core');
const { chromiumPath } = require('./helpers/chromium-path');
const { startNewDynasty } = require('./helpers/start-new-dynasty');

const FILE = 'file://' + path.join(__dirname, '..', 'index.html');
const TABS = ['dashboard', 'newsletter', 'program', 'roster', 'depth', 'development', 'staff', 'recruiting', 'gamelab', 'season', 'stats', 'history', 'records', 'offseason'];
const tab = (page, id) => page.evaluate(t => document.querySelector(`.tabs button[data-tab="${t}"]`).click(), id);
const resolveDecisions = async page => {
  await tab(page, 'dashboard');
  for (let guard = 0; guard < 12 && await page.$eval('#simWeek', el => el.disabled); guard++) {
    const resolved = await page.evaluate(() => {
      const b = [...document.querySelectorAll('[data-decision][data-choice]')].find(el => !el.disabled && el.offsetParent !== null);
      if (!b) return false; b.click(); return true;
    });
    if (!resolved) break;
    await page.waitForTimeout(80);
  }
};

// v0.14.1: dashboard gate note, read-only Program Lab attributes, nav icons, no version labels anywhere,
// the phone ticker and Depth fold, the training-row overlap, and the Game Center layout.
(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--no-sandbox'] });
  try {
    for (const [label, viewport] of [['desktop', { width: 1280, height: 700 }], ['iphone', { width: 390, height: 844 }]]) {
      const phone = label === 'iphone';
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push(String(e)));
      await page.goto(FILE);
      await startNewDynasty(page);

      // Navigation icons.
      if (phone) assert.equal(await page.locator('.client-mobile-nav .client-nav-icon').count(), 5, `[${label}] every bottom-bar item has an icon`);
      else assert.ok(await page.locator('.client-rail .client-nav-icon').count() >= 14, `[${label}] every sidebar item has an icon`);

      // No internal version labels in any tab (the sidebar footer carries the real version, outside the tabs).
      for (const id of TABS) {
        await tab(page, id);
        await page.waitForTimeout(150);
        const text = await page.locator('#' + id).innerText();
        assert.doesNotMatch(text, /\bv\d+\.\d+(\.\d+)?\b/i, `[${label}] no version label in the ${id} tab`);
      }

      // Program Lab: attributes are facts in Dynasty Mode; the editor is for Commissioner Mode.
      await tab(page, 'program');
      assert.equal(await page.locator('#programEditor').isVisible(), false, `[${label}] the edit form is hidden in Dynasty Mode`);
      assert.equal(await page.locator('#programAttributes .program-attr').count(), 6, `[${label}] six read-only attribute tiles`);
      assert.match(await page.locator('#programAttributes').innerText(), /PRESTIGE[\s\S]*RESOURCES[\s\S]*NIL[\s\S]*DEVELOPMENT[\s\S]*FACILITIES[\s\S]*ACADEMICS/i, `[${label}] tiles carry the attributes`);
      assert.match(await page.locator('#programTrends').innerText(), /Complete two seasons to see the trend\./, `[${label}] the trend chart waits for two seasons`);

      // Roles & Depth: the dense role cards fold on a phone only.
      await tab(page, 'depth');
      await page.waitForSelector('#depthGrid select[data-role]', { state: 'attached' });
      if (phone) {
        assert.match(await page.locator('[data-fold-toggle="#depthGrid"]').innerText(), /^Show all \d+ role controls$/, `[${label}] the role cards offer a toggle`);
        assert.equal(await page.locator('#depthGrid').isVisible(), false, `[${label}] the role cards start folded`);
        await page.click('[data-fold-toggle="#depthGrid"]');
        assert.equal(await page.locator('#depthGrid').isVisible(), true, `[${label}] the toggle opens them`);
        assert.match(await page.locator('[data-fold-toggle="#depthGrid"]').innerText(), /^Hide role controls$/, `[${label}] and flips its label`);
      } else {
        assert.equal(await page.locator('[data-fold-toggle="#depthGrid"]').count(), 0, `[${label}] no toggle on desktop`);
        assert.equal(await page.locator('#depthGrid').isVisible(), true, `[${label}] the role cards are always visible on desktop`);
      }

      // Training rows: no two elements overlap (phone cards used to wrap their read cells into each other).
      await tab(page, 'development');
      await page.waitForSelector('#trainingBody tr:not([hidden])', { timeout: 10000 });
      const overlaps = await page.evaluate(() => {
        const found = [];
        for (const tr of document.querySelectorAll('#trainingBody tr:not([hidden])')) {
          for (const td of tr.querySelectorAll('td')) {
            const leaves = [...td.querySelectorAll('*')].filter(e => e.children.length === 0 && (e.textContent.trim() || e.tagName === 'I') && e.getBoundingClientRect().width > 0);
            for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
              const a = leaves[i].getBoundingClientRect(), b = leaves[j].getBoundingClientRect();
              if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) found.push([td.dataset.label, leaves[i].textContent.trim().slice(0, 10)]);
            }
          }
        }
        return found;
      });
      assert.deepEqual(overlaps, [], `[${label}] no overlapping elements in the training rows`);

      // The dashboard says why Sim Week is locked. About a third of fresh dynasties open ungated, so sim
      // forward until a week with a required decision.
      let gated = false;
      for (let hop = 0; hop < 8; hop++) {
        await tab(page, 'dashboard');
        gated = await page.$eval('#simWeek', el => el.disabled);
        await page.waitForFunction(g => document.querySelector('#weekGateNote')?.hidden === !g, gated, { timeout: 10000 });
        if (gated) break;
        const before = await page.evaluate(() => document.querySelector('#weekLine')?.textContent);
        await page.click('#simWeek');
        await page.waitForFunction(w => document.querySelector('#weekLine')?.textContent !== w, before, { timeout: 60000 });
      }
      assert.ok(gated, `[${label}] reached a gated week`);
      assert.match(await page.locator('#weekGateNote').innerText(), /Resolve the Coach’s Desk decisions before advancing the week\. Or use Sim Regular Season and your staff will decide\./, `[${label}] the hero states why and offers the alternative`);
      assert.equal(await page.locator('#weekGateNote .gate-note-go').innerText(), 'Go to decisions', `[${label}] and offers the jump`);
      await resolveDecisions(page);
      await page.waitForFunction(() => document.querySelector('#weekGateNote')?.hidden === true, null, { timeout: 10000 });

      // The phone ticker is one still headline.
      if (phone) {
        await page.waitForSelector('.hud-ticker', { state: 'attached', timeout: 10000 });
        const shown = await page.evaluate(() => [...document.querySelectorAll('.hud-ticker-reel span')].filter(s => getComputedStyle(s).display !== 'none').length);
        assert.equal(shown, 1, `[${label}] one headline shows on a phone`);
        assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.hud-ticker-reel')).animationName), 'none', `[${label}] and it does not scroll`);
      }

      // Game Center.
      await tab(page, 'gamelab');
      await page.waitForFunction(() => !document.querySelector('#watchDetailedGame').disabled, null, { timeout: 10000 });
      await page.click('#watchDetailedGame');
      await page.waitForSelector('#gameDialog[open] .gcf-controls', { timeout: 15000 });
      await page.waitForTimeout(600);
      const watch = await page.evaluate(() => {
        const d = document.querySelector('#gameDialog').getBoundingClientRect(), c = document.querySelector('.gcf-controls').getBoundingClientRect();
        return { inView: c.bottom <= d.bottom + 1 && c.top >= d.top, metaHidden: getComputedStyle(document.querySelector('#gameDialogMeta')).display === 'none' };
      });
      assert.equal(watch.inView, true, `[${label}] the playback controls are visible without scrolling (viewport ${viewport.height}px tall)`);
      assert.equal(watch.metaHidden, true, `[${label}] the Watch tab drops the repeated meta line`);
      await page.locator('#gameDialog button:has-text("⏭")').first().click();
      await page.locator('#gameTabs button', { hasText: /^Summary$/ }).click();
      await page.waitForSelector('.scoreboard .sb-mid', { timeout: 10000 });
      const board = await page.evaluate(() => {
        const tops = new Set([...document.querySelectorAll('#gameTabs button')].filter(b => !b.hidden).map(b => Math.round(b.getBoundingClientRect().top)));
        const home = document.querySelectorAll('.scoreboard .sb-team')[1]?.querySelector('strong')?.textContent.trim();
        return { tabRows: tops.size, mid: document.querySelector('.sb-mid').innerText.replace(/\s+/g, ' '), home, height: Math.round(document.querySelector('.scoreboard').getBoundingClientRect().height) };
      });
      assert.equal(board.tabRows, 1, `[${label}] the Game Center tabs sit on one row`);
      assert.ok(board.home && !board.mid.includes(board.home), `[${label}] the scoreboard does not repeat the home team (${board.mid})`);
      if (phone) assert.ok(board.height < 160, `[${label}] the phone scoreboard is compact (${board.height}px)`);
      assert.match(await page.locator('#gameDialogBody').innerText(), /not recorded for this game/, `[${label}] the recap limits are in plain language`);
      assert.equal(await page.evaluate(() => document.querySelector('#gameDialog').scrollWidth <= document.querySelector('#gameDialog').clientWidth + 1), true, `[${label}] no horizontal overflow in the dialog`);

      assert.deepEqual(errors, [], `[${label}] no console errors`);
      await page.close();
    }
    console.log('ui upgrades browser check passed (desktop + iphone)');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
