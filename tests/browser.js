// Browser smoke test: loads the built standalone HTML in Chromium, exercises
// the UI end to end and fails on any console error or page exception.
const { chromium } = require('playwright-core');
const path = require('path');
// Tabs live inside groups since v0.9.26; selecting the group is part of navigating to a tab.
const TAB_GROUP={"dashboard": "program", "program": "program", "history": "program", "roster": "team", "depth": "team", "development": "team", "recruiting": "recruiting", "gamelab": "games", "season": "games", "stats": "games", "newsletter": "games", "staff": "staff", "offseason": "staff", "records": "staff"};
const goTab=async(page,id)=>{await page.click(`.tab-groups button[data-group="${TAB_GROUP[id]}"]`);await page.click(`.tabs button[data-tab="${id}"]`)};


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
      await goTab(page, t);
      await page.waitForTimeout(60);
      const visible = await page.$eval(`#${t}`, el => el.classList.contains('active'));
      const hasContent = await page.$eval(`#${t}`, el => el.textContent.trim().length > 20);
      check(`[${label}] tab ${t} renders`, visible && hasContent);
    }

    // Watch Mode calculates the detailed game once, hides the final and reveals
    // the permanent drive record as a broadcast. It never changes the outcome.
    await goTab(page, 'gamelab');
    await page.click('#watchDetailedGame');
    await page.waitForFunction(() => document.querySelector('[data-watch-game]')?.dataset.watchBound === '1');
    const watchStart=await page.evaluate(()=>({
      title:document.querySelector('#gameDialogName')?.textContent||'',
      away:document.querySelector('[data-watch-away-score]')?.textContent,
      home:document.querySelector('[data-watch-home-score]')?.textContent,
      visible:[...document.querySelectorAll('[data-watch-drive]')].filter(x=>!x.hidden).length,
      drives:document.querySelectorAll('[data-watch-drive]').length,
    }));
    check(`[${label}] Watch Mode opens without spoiling the final`,
      watchStart.title.includes(' at ')&&!watchStart.title.includes('—')&&watchStart.away==='0'&&watchStart.home==='0'&&watchStart.visible===0&&watchStart.drives>=18&&watchStart.drives<=30,JSON.stringify(watchStart));
    await page.click('[data-watch-next]');
    const firstDrive=await page.evaluate(()=>({
      visible:[...document.querySelectorAll('[data-watch-drive]')].filter(x=>!x.hidden).length,
      caption:document.querySelector('[data-watch-caption]')?.textContent||'',
      progress:document.querySelector('[data-watch-progress]')?.textContent||'',
    }));
    check(`[${label}] next drive advances the broadcast`,firstDrive.visible===1&&firstDrive.caption.includes('plays')&&firstDrive.progress.startsWith('1 of'),JSON.stringify(firstDrive));
    await page.selectOption('[data-watch-speed]','400');
    await page.click('[data-watch-skip]');
    const watchFinal=await page.evaluate(()=>({
      final:!document.querySelector('[data-watch-final-card]')?.hidden,
      line:document.querySelector('[data-watch-final-line]')?.textContent||'',
      visible:[...document.querySelectorAll('[data-watch-drive]')].filter(x=>!x.hidden).length,
    }));
    check(`[${label}] skip reveals the recorded final`,watchFinal.final&&watchFinal.line.includes('—')&&watchFinal.visible===watchStart.drives,JSON.stringify(watchFinal));
    await page.click('[data-watch-summary]');
    check(`[${label}] final summary reveals the permanent score`,(await page.locator('#gameDialogName').innerText()).includes('—'));

    // The original all-drives replay remains available after the broadcast.
    await page.locator('#gameTabs button').filter({hasText:/^Drives$/}).click();
    const motion = await page.evaluate(() => ({
      replay: !!document.querySelector('[data-drive-replay]'),
      steps: document.querySelectorAll('[data-drive-step]').length,
      note: document.querySelector('#gameDialogBody')?.textContent || '',
    }));
    check(`[${label}] drive replay renders all recorded possessions`,
      motion.replay && motion.steps===watchStart.drives && motion.note.includes('exact field position'), JSON.stringify(motion));
    await page.waitForFunction(() => document.querySelector('[data-drive-replay]')?.dataset.motionBound === '1');
    await page.click('[data-drive-play]');
    await page.waitForTimeout(650);
    const moving = await page.evaluate(() => ({
      active: document.querySelectorAll('[data-drive-step].active').length,
      caption: document.querySelector('[data-drive-caption]')?.textContent || '',
      playing: document.querySelector('[data-drive-play]')?.getAttribute('aria-pressed'),
    }));
    check(`[${label}] drive sequence advances its motion graphic`,
      moving.active === 1 && moving.caption.includes('plays') && moving.playing === 'true', JSON.stringify(moving));
    await page.click('[data-drive-play]');
    await page.getByRole('button',{name:'Close Game Center',exact:true}).click();

    // Simulate a week and confirm the UI advances.
    await goTab(page, 'dashboard');
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
    await goTab(page, 'season');
    await page.click('#teamSchedule [data-game]');
    const gameTitle=await page.locator('#gameDialogName').innerText();
    check(`[${label}] completed schedule opens permanent Game Center`,await page.locator('#gameDialog').isVisible()&&gameTitle.includes('—'));
    for(const section of ['Summary','Box Score','Drives','Play-by-Play']){
      await page.locator('#gameTabs button').filter({hasText:new RegExp('^'+section.replace(/-/g,'\\-')+'$')}).click();
      check(`[${label}] Game Center ${section}`, (await page.locator('#gameDialogBody').innerText()).length>30);
    }
    check(`[${label}] Game Center fits viewport`,await page.locator('#gameDialog').evaluate(el=>el.getBoundingClientRect().right<=innerWidth&&el.scrollWidth<=el.clientWidth+1));
    await page.getByRole('button',{name:'Close Game Center',exact:true}).click();
    await goTab(page, 'history');await page.locator('#gameHistoryList [data-game]').first().click();
    check(`[${label}] school history reopens same score`,await page.locator('#gameDialogName').innerText()===gameTitle);
    await page.getByRole('button',{name:'Close Game Center',exact:true}).click();

    // Persistent coach profile dialog.
    await goTab(page, 'staff');
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

    // Recruiting board headers sort the whole pool, not just the visible slice.
    await goTab(page, 'recruiting');
    await page.waitForTimeout(150);
    const readRow = () => page.$eval('#recruitBody tr:first-child', el => el.innerText.replace(/\s+/g, ' '));
    // The header is a real click target for a user (verified by hit-testing:
    // elementFromPoint at its centre returns the TH). Playwright parks the
    // sticky header under the topbar when it auto-scrolls, so dispatch the
    // click on the element instead of fighting its scroll heuristics.
    const sortBy = async key => {
      await page.$eval(`#recruiting th[data-sort="${key}"]`, el => el.click());
      await page.waitForTimeout(150);
    };
    const beforeSort = await readRow();
    await sortBy('miles');
    const milesAsc = await page.evaluate(() => ({
      dir: document.querySelector('#recruiting th[data-sort="miles"]').dataset.dir,
      rows: [...document.querySelectorAll('#recruitBody tr')].slice(0, 8)
        .map(tr => Number(tr.querySelector('td:nth-child(6)')?.textContent.trim())),
    }));
    check(`[${label}] a header click sorts the recruiting board`,
      milesAsc.dir === 'asc' && milesAsc.rows.every((n, i, a) => i === 0 || a[i - 1] <= n),
      JSON.stringify(milesAsc));
    await sortBy('miles');
    const milesDesc = await page.evaluate(() => ({
      dir: document.querySelector('#recruiting th[data-sort="miles"]').dataset.dir,
      rows: [...document.querySelectorAll('#recruitBody tr')].slice(0, 8)
        .map(tr => Number(tr.querySelector('td:nth-child(6)')?.textContent.trim())),
    }));
    check(`[${label}] clicking the same header reverses it`,
      milesDesc.dir === 'desc' && milesDesc.rows.every((n, i, a) => i === 0 || a[i - 1] >= n),
      JSON.stringify(milesDesc));
    // Interest is a column where the interesting end is the top.
    await sortBy('interest');
    check(`[${label}] a best-first column opens descending`,
      await page.$eval('#recruiting th[data-sort="interest"]', el => el.dataset.dir) === 'desc');
    await sortBy('rank');
    check(`[${label}] sorting back by rank restores the default order`, await readRow() === beforeSort);

    // Scheme installation surfaces on the Staff tab while it is in progress.
    await goTab(page, 'staff');
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
    await goTab(page, 'newsletter');
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
    await goTab(page, 'season');
    await page.click('#teamSchedule [data-game]');
    await page.waitForTimeout(120);
    const summaryRecap = await page.$eval('#gameDialogBody .recap', el => el.textContent);
    check(`[${label}] Game Center summary opens with a recap`, summaryRecap.length > 80, summaryRecap.slice(0, 80));
    await page.getByRole('button',{name:'Close Game Center',exact:true}).click();

    // Player profile dialog.
    await goTab(page, 'roster');
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

    // Tab groups (v0.9.26): five groups, and only the active group's tabs are reachable.
    const visibleTabs=()=>page.$$eval('.tabs button',els=>els.filter(e=>!e.hidden).map(e=>e.dataset.tab));
    check(`[${label}] five tab groups`, (await page.$$('.tab-groups button')).length===5);
    await page.click('.tab-groups button[data-group="games"]');
    const gamesTabs=await visibleTabs();
    // Membership is the property under test; the order is body.html's business, not the group's.
    check(`[${label}] a group shows only its own tabs`,
      JSON.stringify([...gamesTabs].sort())===JSON.stringify(['gamelab','newsletter','season','stats']),
      JSON.stringify(gamesTabs));
    check(`[${label}] selecting a group opens its first tab`,
      await page.$eval('.tab.active',el=>el.id)==='gamelab');
    // A programmatic jump (hub tile, weekly plan, go()) must bring its group with it.
    await page.evaluate(()=>document.querySelector('.tabs button[data-tab="records"]').click());
    check(`[${label}] a jump into another group switches the group`,
      await page.$eval('.tab-groups button.active',el=>el.dataset.group)==='staff'
      && await page.$eval('.tab.active',el=>el.id)==='records');
    check(`[${label}] the tab strip no longer scrolls sideways`,
      await page.evaluate(()=>{const n=document.querySelector('.tabs');return n.scrollWidth-n.clientWidth;})===0);
    await goTab(page,'dashboard');

    check(`[${label}] no console errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
    await page.close();
  }

  await browser.close();
  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
