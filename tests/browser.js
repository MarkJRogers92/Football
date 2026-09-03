// Browser smoke test: loads the built standalone HTML in Chromium, exercises
// the UI end to end and fails on any console error or page exception.
const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const results = [];
  let pass = 0, fail = 0;
  const check = (name, cond, detail = '') => {
    if (cond) { pass++; results.push(`  PASS  ${name}`); }
    else { fail++; results.push(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
  };

  for (const [label, viewport] of [['desktop', { width: 1280, height: 900 }], ['iphone', { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));

    await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
    await page.waitForFunction(() => document.querySelector('#userTeam')?.options.length > 0, { timeout: 60000 });

    check(`[${label}] 120 programs in the picker`,
      await page.$eval('#userTeam', el => el.options.length) === 120);
    check(`[${label}] team name rendered`,
      (await page.$eval('#teamName', el => el.textContent)).length > 2);
    check(`[${label}] Top 15 populated`,
      await page.$$eval('#top15 .rankrow', els => els.length) === 15);
    check(`[${label}] command center populated`,
      await page.$$eval('#weeklyHub .hub-item', els => els.length) > 0);

    // Every tab must render without throwing.
    const tabs = await page.$$eval('.tabs button', els => els.map(e => e.dataset.tab));
    for (const t of tabs) {
      await page.click(`.tabs button[data-tab="${t}"]`);
      await page.waitForTimeout(60);
      const visible = await page.$eval(`#${t}`, el => el.classList.contains('active'));
      const hasContent = await page.$eval(`#${t}`, el => el.textContent.trim().length > 20);
      check(`[${label}] tab ${t} renders`, visible && hasContent);
    }

    // Simulate a week and confirm the UI advances.
    await page.click('.tabs button[data-tab="dashboard"]');
    const t0 = Date.now();
    await page.click('#simWeek');
    await page.waitForFunction(() => /Week 1/.test(document.querySelector('#weekLine').textContent), { timeout: 60000 });
    const simMs = Date.now() - t0;
    check(`[${label}] sim week advances the UI (${simMs}ms)`, true);
    check(`[${label}] sim week is responsive`, simMs < 4000, `${simMs}ms`);

    // Weekly hub items link to the tab they describe.
    const hubTab = await page.$eval('#weeklyHub .hub-link', el => el.dataset.tab);
    await page.click('#weeklyHub .hub-link');
    await page.waitForTimeout(120);
    check(`[${label}] hub item opens its tab (${hubTab})`,
      await page.$eval('.tabs button.active', el => el.dataset.tab) === hubTab
      && await page.$eval(`#${hubTab}`, el => el.classList.contains('active')));
    await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));

    // Player profile dialog.
    await page.click('.tabs button[data-tab="roster"]');
    await page.waitForTimeout(80);
    await page.click('#rosterBody .player-button');
    await page.waitForTimeout(120);
    check(`[${label}] player profile opens`,
      await page.$eval('#playerDialog', el => el.hasAttribute('open')));
    await page.evaluate(() => document.querySelector('#playerDialog').close());

    // Mobile layout must not scroll horizontally.
    if (label === 'iphone') {
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`[${label}] no horizontal page overflow`, overflow <= 1, `${overflow}px`);
    }

    check(`[${label}] no console errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
    await page.close();
  }

  await browser.close();
  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
