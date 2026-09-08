const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const expectedVersion = 'v' + fs.readFileSync(path.join(__dirname, '..', 'VERSION.txt'), 'utf8').trim().replace(/^v/, '');

(async()=>{
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox']
  });

  try{
    for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
      const page = await browser.newPage({viewport});
      const errors=[];
      page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
      page.on('pageerror',error=>errors.push(String(error)));

      await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
      await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});

      assert.equal(await page.locator('#titleAbout').isVisible(),true,`[${label}] About entry is visible`);
      await page.click('#titleAbout');
      assert.equal(await page.locator('#titleAboutPanel').isVisible(),true,`[${label}] About panel opens`);
      assert.equal((await page.textContent('[data-about-version]')).trim(),expectedVersion,`[${label}] About shows current version`);
      assert.match(await page.textContent('#titleAboutPanel'),/Fictional college football dynasty simulator/i,`[${label}] About identifies the game`);
      assert.match(await page.textContent('#titleAboutPanel'),/Browser slots \+ complete exports/i,`[${label}] About explains save model`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`[${label}] About does not overflow viewport`);
      await page.click('[data-title-about-back]');
      assert.equal(await page.locator('#titleMainMenu').isVisible(),true,`[${label}] About returns to main menu`);

      await page.click('#titleOptions');
      assert.equal(await page.locator('#titleOptionsPanel').isVisible(),true,`[${label}] Options panel opens`);
      assert.equal((await page.textContent('#titleOptionsHeading')).trim(),'Game & Presentation',`[${label}] Options has clear heading`);
      assert.deepEqual(await page.$$eval('#titleWatchSpeed option',options=>options.map(o=>[o.textContent.trim(),o.value])),[['Slow','1400'],['Normal','850'],['Fast','400']],`[${label}] Watch pace choices preserved`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`[${label}] Options does not overflow viewport`);

      await page.selectOption('#titleWatchSpeed','400');
      await page.evaluate(()=>{document.querySelector('#titleMotion').checked=false});
      await page.click('#titleSaveOptions');
      await page.waitForFunction(()=>!document.querySelector('#titleMainMenu').hidden);
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dynastyLabPreferences')));
      assert.deepEqual(saved,{motion:false,watchSpeed:'400'},`[${label}] Options persist on this device`);

      await page.click('#titleOptions');
      assert.equal(await page.$eval('#titleWatchSpeed',el=>el.value),'400',`[${label}] saved Watch pace is restored`);
      assert.equal(await page.$eval('#titleMotion',el=>el.checked),false,`[${label}] saved motion preference is restored`);
      await page.click('#titleResetOptions');
      assert.equal(await page.$eval('#titleWatchSpeed',el=>el.value),'850',`[${label}] Restore Defaults returns Watch pace to Normal`);
      const expectedMotion=await page.evaluate(()=>!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
      assert.equal(await page.$eval('#titleMotion',el=>el.checked),expectedMotion,`[${label}] Restore Defaults follows device motion preference`);
      const beforeSave=await page.evaluate(()=>JSON.parse(localStorage.getItem('dynastyLabPreferences')));
      assert.deepEqual(beforeSave,{motion:false,watchSpeed:'400'},`[${label}] Restore Defaults waits for explicit save`);
      await page.click('#titleSaveOptions');

      assert.deepEqual(errors,[],`[${label}] title menus produce no console/page errors`);
      await page.close();
      console.log(`PASS ${label} Options/About title menus`);
    }
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1)});
