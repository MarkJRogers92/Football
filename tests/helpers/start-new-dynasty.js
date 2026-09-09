async function startNewDynasty(page,{beginSeason=true}={}){
  await page.waitForSelector('#titleNew',{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
  await page.click('#titleNew');
  await page.locator('#dynastySetup').waitFor({state:'visible',timeout:10000});
  await page.click('[data-setup-quick]');
  await page.waitForFunction(()=>{
    const button=document.querySelector('#setupContinue');
    return /What You Inherited/.test(document.querySelector('#setupStatus')?.textContent||'')&&!button?.disabled;
  },{timeout:60000});
  await page.click('#setupContinue');
  await page.waitForFunction(()=>/Accept the Contract/.test(document.querySelector('#setupStatus')?.textContent||''),{timeout:10000});
  await page.click('#setupContinue');
  await page.locator('#app').waitFor({state:'visible',timeout:60000});
  if(beginSeason){
    await page.click('#hubAdvance');
    await page.waitForFunction(()=>window.__DL_TEST__.preseasonDebug().phase==='regular',{timeout:30000});
  }
}

module.exports={startNewDynasty};
