// Since v0.20 a new dynasty starts with the staff running recruiting. Tests written for a hand-run board keep one
// unless they ask for the default with {staffRecruiting:true}.
async function startNewDynasty(page,{beginSeason=true,staffRecruiting=false}={}){
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
  // The packaged desktop app (and any build without automation) has no test hooks; it plays the default.
  if(!staffRecruiting)await page.evaluate(()=>window.__DL_TEST__?.setStaffRecruiting?.(false));
  if(beginSeason){
    await page.click('#hubAdvance');
    await page.waitForFunction(()=>window.__DL_TEST__?window.__DL_TEST__.preseasonDebug().phase==='regular':/Week 1$/.test(document.querySelector('#weekLine')?.textContent||''),{timeout:30000});
  }
}

module.exports={startNewDynasty};
