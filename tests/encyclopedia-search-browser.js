const assert = require('assert/strict');
const path = require('path');
const { chromium } = require('playwright-core');
const { chromiumPath } = require('./helpers/chromium-path');
const { startNewDynasty } = require('./helpers/start-new-dynasty');

const FILE = 'file://' + path.join(__dirname, '..', 'index.html');

// v0.12.10: the Playbook answers "who is this?" as well as "where do I go?".
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

      const teamName = await page.evaluate(() => document.querySelector('#userTeam').value);
      const term = teamName.split(/\s+/)[0];

      const openPlaybook = () => page.evaluate(() => document.querySelector('.hud-playbook-trigger').click());
      await openPlaybook();
      await page.waitForSelector('.hud-playbook:not([hidden])', { timeout: 10000 });
      await page.fill('.hud-playbook-search', term);
      await page.waitForSelector('.hud-playbook-list li[data-kind="team"]', { timeout: 5000 });

      const rows = await page.$$eval('.hud-playbook-list li[data-kind]', nodes => nodes.map(node => ({
        kind: node.dataset.kind,
        label: node.querySelector('strong').textContent.trim(),
        meta: node.querySelector('small').textContent.trim(),
      })));
      const teamRow = rows.find(row => row.kind === 'team' && row.label === teamName);
      assert.ok(teamRow, `[${label}] the controlled program is found by name`);
      assert.match(teamRow.meta, /·/, `[${label}] the program row carries its conference and record`);

      // Enter opens the entity rather than navigating to a section.
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('.tabs button[data-tab="program"]')?.classList.contains('active'), { timeout: 10000 });
      await page.waitForFunction(() => document.querySelector('.hud-playbook').hidden, { timeout: 5000 });

      // A different program opens a read-only peek and must never switch control.
      const otherName = await page.evaluate(name => {
        const options = [...document.querySelectorAll('#userTeam option')].map(option => option.value);
        return options.find(value => value !== name) || null;
      }, teamName);
      assert.ok(otherName, `[${label}] the league has another program`);
      await openPlaybook();
      await page.waitForSelector('.hud-playbook:not([hidden])', { timeout: 10000 });
      await page.fill('.hud-playbook-search', otherName);
      await page.waitForSelector('.hud-playbook-list li[data-kind="team"]', { timeout: 5000 });
      await page.locator('.hud-playbook-list li[data-kind="team"]').filter({ hasText: otherName }).first().click();
      await page.waitForFunction(() => document.querySelector('#programPeek')?.open === true, { timeout: 5000 });
      assert.equal(await page.evaluate(() => document.querySelector('#userTeam').value), teamName,
        `[${label}] searching another program must not switch the controlled program`);
      await page.evaluate(() => document.querySelector('#programPeek form button').click());
      await page.waitForFunction(() => !document.querySelector('#programPeek')?.open, { timeout: 5000 });

      // A player from the roster is searchable and opens the dossier.
      await page.evaluate(() => document.querySelector('.tabs button[data-tab="roster"]').click());
      const playerName = await page.$eval('#rosterBody [data-player]', element => element.textContent.trim());
      await openPlaybook();
      await page.waitForSelector('.hud-playbook:not([hidden])', { timeout: 10000 });
      await page.fill('.hud-playbook-search', playerName);
      await page.waitForSelector('.hud-playbook-list li[data-kind="player"]', { timeout: 5000 });
      const playerLabels = await page.$$eval('.hud-playbook-list li[data-kind="player"] strong', nodes => nodes.map(node => node.textContent.trim()));
      assert.ok(playerLabels.includes(playerName), `[${label}] the roster player is found`);
      await page.locator('.hud-playbook-list li[data-kind="player"]').filter({ hasText: playerName }).first().click();
      await page.waitForFunction(name => {
        const dialog = document.querySelector('#playerDialog');
        return dialog?.open && document.querySelector('#playerDialogName')?.textContent.trim() === name;
      }, playerName, { timeout: 10000 });
      await page.keyboard.press('Escape');

      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `[${label}] no horizontal overflow`);
      assert.deepEqual(errors, [], `[${label}] no console errors`);
      await page.close();
    }
    console.log('encyclopedia search browser check passed (desktop + iphone)');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
