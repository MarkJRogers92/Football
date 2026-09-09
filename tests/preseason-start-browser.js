// Focused browser coverage for the new-dynasty preseason boundary.
const {chromium} = require('playwright-core');
const assert = require('node:assert/strict');
const path = require('path');

const TAB_GROUP = {
  dashboard: 'program', depth: 'team', recruiting: 'recruiting', gamelab: 'games',
};
const goTab = (page, id) => page.evaluate(({id, group}) => {
  document.querySelector(`.tab-groups button[data-group="${group}"]`)?.click();
  document.querySelector(`.tabs button[data-tab="${id}"]`)?.click();
}, {id, group: TAB_GROUP[id]});
const debug = page => page.evaluate(() => window.__DL_TEST__.preseasonDebug());

async function startNewDynasty(page) {
  await page.waitForFunction(() => document.querySelector('#titleTeam')?.options.length > 0,
    {timeout: 60000});
  await page.click('#titleNew');
  await page.locator('#titleStart').waitFor({state: 'visible', timeout: 10000});
  await page.click('#titleStart');
  await page.locator('#app').waitFor({state: 'visible', timeout: 60000});
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });

  for (const [label, viewport] of [
    ['desktop', {width: 1280, height: 900}],
    ['mobile', {width: 390, height: 844}],
  ]) {
    const context = await browser.newContext({viewport});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await startNewDynasty(page);

    const created = await debug(page);
    assert.equal(created.phase, 'preseason');
    assert.equal(created.week, 0);
    assert.equal(created.played, 0);
    assert.equal(created.targeted, 0,
      `${label}: a new dynasty opens at an unplayed preseason checkpoint`);
    assert.match(await page.locator('#weekLine').innerText(), /Preseason/);
    assert.equal(await page.locator('#hubAdvance').innerText(), 'Begin Season');
    assert.equal(await page.locator('#hubAdvance').isEnabled(), true);
    for (const selector of ['#simWeek', '#seasonWeek', '#simSeason', '#simDetailedGame', '#watchDetailedGame']) {
      assert.equal(await page.locator(selector).isDisabled(), true,
        `${label}: ${selector} is unavailable before Begin Season`);
    }

    await goTab(page, 'gamelab');
    assert.match(await page.locator('#nextGameCard').innerText(), /Begin Season/i);
    assert.equal(await page.locator('[data-v2-gameday-start]').count(), 0,
      `${label}: no Game Day action is exposed during preseason`);

    await goTab(page, 'dashboard');
    await page.locator('#weeklyHub .hub-item[data-tab="depth"]').click();
    await page.locator('#depth.active').waitFor({state: 'visible'});
    await goTab(page, 'dashboard');
    await page.locator('#weeklyHub .hub-item[data-tab="recruiting"]').click();
    await page.locator('#recruiting.active').waitFor({state: 'visible'});
    await page.click('#autoTarget');
    await page.waitForFunction(() => window.__DL_TEST__.preseasonDebug().targeted > 0);
    const targeted = (await debug(page)).targeted;

    await page.locator('#saveBrowser').evaluate(button => button.click());
    await page.waitForFunction(() => /^Saved /.test(document.querySelector('#saveStatus')?.textContent || ''),
      {timeout: 30000});
    await page.reload();
    await page.waitForFunction(() => !document.querySelector('#titleContinue')?.disabled, {timeout: 60000});
    assert.match(await page.locator('#titleContinueMeta').innerText(), /Preseason/,
      `${label}: the title screen describes the saved preseason accurately`);
    await page.click('#titleContinue');
    await page.locator('#app').waitFor({state: 'visible', timeout: 60000});
    assert.equal((await debug(page)).phase, 'preseason');
    assert.equal((await debug(page)).targeted, targeted,
      `${label}: preseason recruiting setup survives save and reload`);
    await goTab(page, 'recruiting');
    assert.match(await page.locator('#classSummary').innerText(), new RegExp(`${targeted} active targets?`),
      `${label}: the restored recruiting edit remains visible`);

    await goTab(page, 'dashboard');
    const ctaFits = await page.locator('#hubAdvance').evaluate(button => {
      const rect = button.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= document.documentElement.scrollHeight;
    });
    assert.equal(ctaFits, true, `${label}: Begin Season remains reachable`);
    const rngBefore = (await debug(page)).rng;
    await page.click('#hubAdvance');
    await page.waitForFunction(() => window.__DL_TEST__.preseasonDebug().phase === 'regular');
    const after = await debug(page);
    assert.equal(after.week, 0);
    assert.equal(after.played, 0);
    assert.equal(after.rng, rngBefore, `${label}: Begin Season consumes no gameplay RNG`);
    assert.notEqual(await page.locator('#hubAdvance').innerText(), 'Begin Season');
    assert.equal(await page.locator('#simSeason').isEnabled(), true);

    await goTab(page, 'gamelab');
    assert.doesNotMatch(await page.locator('#nextGameCard').innerText(), /Begin Season/i);
    assert.equal(await page.locator('#simDetailedGame').isEnabled(), true,
      `${label}: the generated Week 1 matchup becomes playable`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
      true, `${label}: preseason flow has no page-level horizontal overflow`);
    assert.deepEqual(errors, [], `${label}: preseason flow emits no browser errors`);
    await context.close();
  }

  await browser.close();
  console.log('Preseason start browser checks passed at desktop and mobile widths.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
