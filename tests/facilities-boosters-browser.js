'use strict';
// Facilities & boosters on the Program page, and the weather/stadium strip on Game Day, in a real browser at
// desktop and phone width. The booster controls must work, spend only what exists, leave the game stream alone
// and never overflow the page.
const assert = require('node:assert/strict'), path = require('node:path');
const {chromium} = require('playwright-core'), {chromiumPath} = require('./helpers/chromium-path'), {startNewDynasty} = require('./helpers/start-new-dynasty');

const openProgram = page => page.evaluate(() => {
  const g = document.querySelector('.tab-groups button[data-group="program"]'); if (g && !g.classList.contains('active')) g.click();
  document.querySelector('.tabs button[data-tab="program"]')?.click();
});
const openGameDay = page => page.evaluate(() => {
  const g = document.querySelector('.tab-groups button[data-group="season"]'); if (g && !g.classList.contains('active')) g.click();
  document.querySelector('.tabs button[data-tab="gamelab"]')?.click();
});
const summary = page => page.evaluate(() => {
  const read = label => [...document.querySelectorAll('#facilitiesBoosters .fb-summary > div')].find(d => d.textContent.includes(label))?.querySelector('strong')?.textContent.trim();
  return {rating: read('Facilities rating'), fund: read('Booster fund'), goodwill: read('Goodwill'), nil: read('NIL this season')};
});
const num = text => Number(String(text).match(/-?\d+/)?.[0]);

(async () => {
  const browser = await chromium.launch({executablePath: chromiumPath(), args: ['--no-sandbox']});
  try {
    for (const width of [1280, 390]) {
      const label = width > 700 ? 'desktop' : 'phone';
      const page = await browser.newPage({viewport: {width, height: 900}, reducedMotion: 'reduce'}), errors = [];
      page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto('file://' + path.join(__dirname, '..', 'index.html')); await startNewDynasty(page);

      // --- Program page: the card renders with all three tracks and the booster controls.
      await openProgram(page);
      await page.waitForSelector('#facilitiesBoosters .fb-track', {timeout: 15000});
      assert.equal(await page.locator('#facilitiesBoosters .fb-track').count(), 3, `[${label}] three build tracks`);
      assert.match(await page.locator('#facilitiesBoosters').textContent(), /Stadium & Game Day[\s\S]*Training & Performance Center[\s\S]*Football Operations Building/);
      assert.equal(await page.locator('#facilitiesBoosters [data-fb-campaign]').count(), 4, `[${label}] two campaigns, each to facilities or NIL`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 1, `[${label}] no horizontal overflow (${overflow}px)`);
      const rng = await page.evaluate(() => window.__DL_TEST__.preseasonDebug().rng);
      assert.ok(rng && rng.length > 10, `[${label}] the gameplay random stream is readable`);
      const start = await summary(page), startFund = num(start.fund), startNil = num(start.nil);
      assert.ok(startFund >= 0 && startNil >= 0);

      // --- A dinner raises money for the fund; the next one is sent to NIL instead.
      await page.click('[data-fb-campaign="dinner"][data-fb-dest="facilities"]');
      let now = await summary(page);
      assert.ok(num(now.fund) > startFund, `[${label}] a dinner adds to the fund (${start.fund} -> ${now.fund})`);
      assert.equal(num(now.nil), startNil, `[${label}] and leaves NIL alone`);
      const fundAfterDinner = num(now.fund);
      await page.click('[data-fb-campaign="dinner"][data-fb-dest="nil"]');
      now = await summary(page);
      assert.equal(num(now.fund), fundAfterDinner, `[${label}] a gift sent to NIL does not touch the fund`);
      assert.ok(num(now.nil) > startNil, `[${label}] it raises this season's NIL`);
      const campaignText = await page.locator('#facilitiesBoosters').textContent();
      assert.match(campaignText, /1 of 3 campaigns left/);

      // --- Redirecting NIL moves it into the fund.
      const nilBefore = num(now.nil), fundBefore = num(now.fund);
      await page.click('[data-fb-divert="1"]');
      now = await summary(page);
      assert.equal(num(now.nil), nilBefore - 1, `[${label}] one NIL unit leaves the NIL budget`);
      assert.equal(num(now.fund), fundBefore + 1, `[${label}] and lands in the fund`);

      // --- Break ground, pay in, then shelve and get the money back.
      await page.click('[data-fb-start="stadium"]');
      await page.waitForSelector('#facilitiesBoosters [data-fb-track="stadium"] [data-fb-fund]');
      assert.match(await page.locator('#facilitiesBoosters [data-fb-track="stadium"]').textContent(), /Level 1 · 0 of 4 units paid/);
      const beforePay = num((await summary(page)).fund);
      await page.click('#facilitiesBoosters [data-fb-track="stadium"] [data-fb-fund][data-fb-units="1"]');
      assert.equal(num((await summary(page)).fund), beforePay - 1, `[${label}] paying in comes out of the fund`);
      assert.match(await page.locator('#facilitiesBoosters [data-fb-track="stadium"]').textContent(), /1 of 4 units paid/);
      await page.click('#facilitiesBoosters [data-fb-cancel]');
      assert.equal(num((await summary(page)).fund), beforePay, `[${label}] shelving returns everything paid`);
      assert.equal(await page.locator('#facilitiesBoosters [data-fb-track="stadium"] [data-fb-start]').count(), 1);

      // --- Fund a project outright and see it under construction.
      await page.evaluate(() => { const t = window.__DL_TEST__.selected(); window.DynastyFacilities.state(t).fund = 12; });
      await openProgram(page);
      await page.click('[data-fb-start="football_ops"]');
      await page.click('#facilitiesBoosters [data-fb-track="football_ops"] [data-fb-fund]:not([data-fb-units])');
      await page.waitForSelector('#facilitiesBoosters [data-fb-track="football_ops"] .is-built');
      assert.match(await page.locator('#facilitiesBoosters [data-fb-track="football_ops"]').textContent(), /Under construction · level 1 opens in 1 season/);
      assert.equal(await page.locator('#facilitiesBoosters [data-fb-track="football_ops"] [data-fb-cancel]').count(), 0, `[${label}] a contracted project cannot be shelved`);

      // --- Nothing here may consume gameplay randomness or leave the page broken.
      const rngAfter = await page.evaluate(() => window.__DL_TEST__.preseasonDebug().rng);
      assert.equal(rngAfter, rng, `[${label}] booster actions draw no gameplay randomness`);
      assert.ok(await page.evaluate(() => { const t = window.__DL_TEST__.selected(); return t.facilityPlan?.projects?.length === 1; }), `[${label}] the plan is on the program so it is saved with it`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 1, `[${label}] still no overflow`);

      // --- Game Day names the stadium and the weather before the first snap.
      await openGameDay(page);
      await page.waitForSelector('#v2InteractiveGameDay [data-v2-gameday-start]', {timeout: 15000});
      await page.click('[data-v2-gameday-start]');
      await page.waitForSelector('#v2InteractiveGameDay .v2-gameday-conditions', {timeout: 15000});
      const strip = await page.locator('#v2InteractiveGameDay .v2-gameday-conditions').textContent();
      assert.match(strip, /(Clear|Overcast|Indoors|Rain|Snow|Drizzle|Flurries)/, `[${label}] Game Day shows the sky: ${strip}`);
      const conditions = await page.evaluate(() => window.__DL_TEST__.v2GameDayPreviewState().state.rules?.conditions);
      assert.ok(conditions && conditions.version === 1, `[${label}] the live game carries its conditions`);
      const saved = await page.evaluate(() => window.__DL_TEST__.v2GameDaySaved());
      assert.deepEqual(saved.rules.conditions, conditions, `[${label}] the saved live game keeps its rules so a reload rebuilds the same game`);

      assert.deepEqual(errors, [], `[${label}] browser errors: ${errors.join('\n')}`);
      await page.close();
    }
    console.log('PASS facilities & boosters: the Program card, booster campaigns, NIL trade-off and build projects work at desktop and phone width, and Game Day shows the conditions');
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exit(1); });
