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
  await page.waitForFunction(()=>{
    const debug=window.__DL_TEST__?.setupDebug?.();
    return !document.querySelector('#app')?.hidden||(debug&&!debug.submitting&&!document.querySelector('#dynastySetup')?.hidden);
  },{timeout:180000});
  if(await page.locator('#app').isHidden()){
    const failure=await page.evaluate(()=>({status:document.querySelector('#setupStatus')?.textContent||'',debug:window.__DL_TEST__?.setupDebug?.()}));
    throw new Error(`Setup acceptance failed: ${failure.status} · ${JSON.stringify(failure.debug)}`);
  }
  if(beginSeason){
    await page.click('#hubAdvance');
    await page.waitForFunction(()=>window.__DL_TEST__.preseasonDebug().phase==='regular',{timeout:30000});
  }
}

module.exports={startNewDynasty};
