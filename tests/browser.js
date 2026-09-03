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

    // Reopen a completed result and navigate every Game Center section.
    await page.click('.tabs button[data-tab="season"]');
    await page.click('#teamSchedule [data-game]');
    const gameTitle=await page.locator('#gameDialogName').innerText();
    check(`[${label}] completed schedule opens permanent Game Center`,await page.locator('#gameDialog').isVisible()&&gameTitle.includes('—'));
    for(const section of ['Summary','Box Score','Drives','Play-by-Play']){
      await page.locator('#gameTabs button').filter({hasText:new RegExp('^'+section.replace(/-/g,'\\-')+'$')}).click();
      check(`[${label}] Game Center ${section}`, (await page.locator('#gameDialogBody').innerText()).length>30);
    }
    check(`[${label}] Game Center fits viewport`,await page.locator('#gameDialog').evaluate(el=>el.getBoundingClientRect().right<=innerWidth&&el.scrollWidth<=el.clientWidth+1));
    await page.getByRole('button',{name:'Close Game Center',exact:true}).click();
    await page.click('.tabs button[data-tab="history"]');await page.locator('#gameHistoryList [data-game]').first().click();
    check(`[${label}] school history reopens same score`,await page.locator('#gameDialogName').innerText()===gameTitle);
    await page.getByRole('button',{name:'Close Game Center',exact:true}).click();

    // Persistent coach profile dialog.
    await page.click('.tabs button[data-tab="staff"]');
    await page.click('#staffList [data-coach]');
    await page.waitForTimeout(80);
    check(`[${label}] coach profile opens`, await page.locator('#coachDialog').isVisible());
    check(`[${label}] coach profile shows career history`, /Career timeline/i.test(await page.locator('#coachDialogBody').innerText()));
    check(`[${label}] coach profile fits viewport`, await page.locator('#coachDialog').evaluate(el=>el.getBoundingClientRect().right<=innerWidth&&el.scrollWidth<=el.clientWidth+1));
    await page.getByRole('button',{name:'Close coach profile',exact:true}).click();

    // Coaching market: force a DC opening on the controlled team, interview a
    // fresh candidate, and hire through the same Interview/Offer buttons a
    // player uses. Math.random is nudged low (never exactly 0 -- that stalls
    // this build's gauss()) so the offer is accepted deterministically.
    const marketBefore = await page.evaluate(() => {
      const { selected, createOpening, renderStaff } = window.__DL_TEST__;
      const t = selected(); createOpening(t, 'DC', 'Left for another opportunity', 'DEPARTED'); renderStaff();
      return { interim: !!t.staff.DC.interim, oldDcId: t.staff.DC.id };
    });
    check(`[${label}] an opening installs an interim and a candidate market`, marketBefore.interim);
    await page.waitForTimeout(60);
    check(`[${label}] Staff tab shows the coaching search panel`,
      await page.$eval('#coachMarket', el => el.textContent.includes('Coaching Search')));
    await page.click('#coachMarket [data-interview]');
    await page.waitForTimeout(60);
    check(`[${label}] interviewing a candidate enables Make Offer`,
      await page.$eval('#coachMarket [data-start-offer]', el => !el.disabled));
    await page.click('#coachMarket [data-start-offer]');
    await page.waitForTimeout(60);
    check(`[${label}] Make Offer reveals the offer form`, await page.$('#coachMarket .offer-form') !== null);
    await page.evaluate(() => { window.__realRandom = Math.random; Math.random = () => 0.0001; });
    await page.click('#coachMarket [data-send-offer]');
    await page.waitForTimeout(60);
    await page.evaluate(() => { Math.random = window.__realRandom; });
    const hireResult = await page.evaluate((oldDcId) => {
      const t = window.__DL_TEST__.selected();
      return { interim: !!t.staff.DC.interim, hired: t.staff.DC.id !== oldDcId,
        status: document.querySelector('#saveStatus').textContent };
    }, marketBefore.oldDcId);
    check(`[${label}] sending the offer hires the coach and clears the interim tag`,
      !hireResult.interim && hireResult.hired, JSON.stringify(hireResult));

    // Scheme installation surfaces on the Staff tab while it is in progress.
    await page.click('.tabs button[data-tab="staff"]');
    const schemeInstall = await page.evaluate(() => {
      const { selected, setTeamScheme, renderStaff } = window.__DL_TEST__;
      const t = selected(), from = t.offScheme;
      const list = ['Tempo Spread','Ground Pressure','Option Motion','Vertical Strike'];
      const target = list.find(s => s !== from);
      setTeamScheme(t, 'off', target, 'browser test');
      renderStaff();
      return { from, target, card: document.querySelector('#schemeCard').textContent,
               bar: !!document.querySelector('#schemeCard .bar > span') };
    });
    check(`[${label}] a scheme installation shows its progress on the Staff tab`,
      /Installing/.test(schemeInstall.card) && schemeInstall.card.includes(schemeInstall.from) && schemeInstall.bar,
      schemeInstall.card.slice(0, 120));

    // Weekly newsletter: recaps derived from the archived box scores.
    await page.click('.tabs button[data-tab="newsletter"]');
    await page.waitForTimeout(120);
    const news = await page.evaluate(() => ({
      weeks: document.querySelector('#newsWeek').options.length,
      lead: document.querySelector('#newsletterBody .news-lead .recap')?.textContent || '',
      items: document.querySelectorAll('#newsletterBody .news-item').length,
    }));
    check(`[${label}] newsletter lists played weeks`, news.weeks > 0, JSON.stringify(news.weeks));
    check(`[${label}] newsletter writes a lead recap`, news.lead.length > 80 && /\d+–\d+/.test(news.lead), news.lead.slice(0, 80));
    await page.selectOption('#newsScope', 'team');
    await page.waitForTimeout(120);
    const teamLead = await page.$eval('#newsletterBody .news-lead .recap', el => el.textContent);
    const teamName = await page.$eval('#teamName', el => el.textContent);
    check(`[${label}] program coverage leads with the controlled team`, teamLead.includes(teamName.trim()), teamLead.slice(0, 80));

    // Game Center summary opens with the same generated recap.
    await page.click('.tabs button[data-tab="season"]');
    await page.click('#teamSchedule [data-game]');
    await page.waitForTimeout(120);
    const summaryRecap = await page.$eval('#gameDialogBody .recap', el => el.textContent);
    check(`[${label}] Game Center summary opens with a recap`, summaryRecap.length > 80, summaryRecap.slice(0, 80));
    await page.getByRole('button',{name:'Close Game Center',exact:true}).click();

    // Player profile dialog.
    await page.click('.tabs button[data-tab="roster"]');
    await page.waitForTimeout(80);
    await page.click('#rosterBody .player-button');
    await page.waitForTimeout(120);
    check(`[${label}] player profile opens`,
      await page.$eval('#playerDialog', el => el.hasAttribute('open')));

    // Portraits paint after the row markup lands; confirm they actually filled.
    const portraits = await page.evaluate(() => {
      const cs = [...document.querySelectorAll('canvas[data-portrait]')];
      return { total: cs.length, painted: cs.filter(c => c.dataset.portraitPainted === '1').length,
               failed: cs.filter(c => c.dataset.portraitPainted === 'error').length };
    });
    check(`[${label}] roster portraits paint (${portraits.painted}/${portraits.total})`,
      portraits.total > 0 && portraits.painted === portraits.total && portraits.failed === 0,
      JSON.stringify(portraits));
    const dialogPortrait = await page.evaluate(() =>
      document.querySelector('#playerDialogPortrait canvas')?.dataset.portraitPainted);
    check(`[${label}] profile portrait paints`, dialogPortrait === '1', String(dialogPortrait));
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
