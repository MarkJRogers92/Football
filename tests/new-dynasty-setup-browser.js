const assert = require('assert/strict');
const path = require('path');
const {chromium} = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({viewport: {width: 1440, height: 960}});
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  try {
    await page.goto(`file://${path.join(__dirname, '..', 'index.html')}`);
    await page.waitForFunction(() => document.querySelector('#titleTeam')?.options.length === 120,
      {timeout: 60000});
    await page.click('#titleNew');
    await page.locator('#dynastySetup').waitFor({state: 'visible'});
    assert.equal(await page.locator('.setup-progress-step').count(), 7,
      'setup exposes seven focused screens');
    assert.match(await page.locator('#setupHeading').innerText(), /Take the Job/i);

    await page.click('#setupContinue');
    assert.match(await page.locator('#setupHeading').innerText(), /Put your name on the office/i);
    assert.equal(await page.locator('#setupContinue').isDisabled(), true,
      'coach identity is required');
    await page.fill('#setupCoachName', 'Jordan Rivers');
    assert.equal(await page.locator('#setupContinue').isEnabled(), true);
    await page.reload();
    await page.locator('#dynastySetup').waitFor({state: 'visible', timeout: 30000});
    assert.equal(await page.locator('#setupCoachName').inputValue(), 'Jordan Rivers',
      'an active setup draft recovers after refresh');

    await page.click('#setupContinue');
    assert.match(await page.locator('#setupHeading').innerText(), /Choose the program/i);
    assert.equal(await page.locator('.setup-program-row').count(), 120,
      'all programs are available');
    await page.fill('#setupProgramSearch', 'Lake Erie');
    assert.equal(await page.locator('.setup-program-row').count(), 1,
      'program search narrows the real program catalog');
    await page.click('[data-setup-program="Lake Erie University"]');

    await page.click('#setupContinue');
    assert.match(await page.locator('#setupHeading').innerText(), /Set the program identity/i);
    await page.click('label:has([data-setup-field="offScheme"][value="Tempo Spread"])');
    await page.click('label:has([data-setup-field="defScheme"][value="Pressure Multiple"])');
    await page.click('label:has([data-setup-field="trainingFocus"][value="Fundamentals"])');

    await page.click('#setupContinue');
    assert.match(await page.locator('#setupHeading').innerText(), /Configure the world/i);
    assert.match(await page.locator('#setupContent').innerText(), /120 fictional programs/i);
    assert.match(await page.locator('#setupContent').innerText(), /Not exposed yet/i);
    await page.click('label:has([data-setup-field="mode"][value="commissioner"])');

    await page.click('#setupContinue');
    await page.waitForFunction(() => !document.querySelector('#setupContinue')?.disabled,
      {timeout: 60000});
    assert.match(await page.locator('#setupHeading').innerText(), /What You Inherited/i);
    const briefing = await page.locator('#setupContent').innerText();
    assert.match(briefing, /Lake Erie University/i);
    assert.match(briefing, /Roster & scholarships/i);
    assert.match(briefing, /first 30 days/i);

    await page.click('#setupContinue');
    assert.match(await page.locator('#setupHeading').innerText(), /Accept the contract/i);
    assert.match(await page.locator('#setupContent').innerText(), /Jordan Rivers/i);
    assert.match(await page.locator('#setupContent').innerText(), /Tempo Spread/i);
    assert.match(await page.locator('#setupContent').innerText(), /Pressure Multiple/i);
    assert.match(await page.locator('#setupContent').innerText(), /Fundamentals/i);
    await page.click('#setupContinue');
    await page.locator('#app').waitFor({state: 'visible', timeout: 60000});

    const state = await page.evaluate(() => ({
      phase: window.__DL_TEST__.preseasonDebug().phase,
      setup: window.__DL_TEST__.setupDebug(),
    }));
    assert.equal(state.phase, 'preseason', 'the accepted job opens at the true preseason boundary');
    assert.equal(state.setup.saveCount, 1, 'acceptance creates exactly one save');
    assert.deepEqual({
      completed: state.setup.setup.completed,
      coachName: state.setup.setup.coachName,
      programName: state.setup.setup.programName,
      offScheme: state.setup.setup.offScheme,
      defScheme: state.setup.setup.defScheme,
      trainingFocus: state.setup.setup.trainingFocus,
      mode: state.setup.setup.mode,
    }, {
      completed: true,
      coachName: 'Jordan Rivers',
      programName: 'Lake Erie University',
      offScheme: 'Tempo Spread',
      defScheme: 'Pressure Multiple',
      trainingFocus: 'Fundamentals',
      mode: 'commissioner',
    }, 'the accepted contract writes every supported setup choice');
    assert.equal(await page.evaluate(() => localStorage.getItem('dynastyLabNewDynastySetupV1')), null,
      'the completed draft is cleared only after the save succeeds');

    await page.reload();
    await page.waitForFunction(() => !document.querySelector('#titleContinue')?.disabled,
      {timeout: 60000});
    assert.equal(await page.locator('#dynastySetup').isHidden(), true,
      'completed and migrated saves bypass setup');
    await page.click('#titleContinue');
    await page.locator('#app').waitFor({state: 'visible'});
    assert.match(await page.locator('#teamName').innerText(), /Lake Erie University/i);
    assert.deepEqual(errors, [], `setup emits no console or page errors: ${errors.join(' | ')}`);
    console.log('PASS Take the Job setup recovers, generates, saves once, and restores in preseason');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
