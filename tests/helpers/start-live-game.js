// Starts the live game from Game Day. A live game cannot begin while a Coach's Desk decision for the week is pending
// (it could never be recorded), so the staff resolve those first, the way Sim Season does. Weekly prep is left as
// the test set it.
async function resolvePendingWeeklyDecisions(page){
  await page.evaluate(()=>window.__DL_TEST__.resolvePendingWeeklyDecisions());
}
async function startLiveGame(page,selector='[data-v2-gameday-start]'){
  await resolvePendingWeeklyDecisions(page);
  await page.waitForSelector(`${selector}:not([disabled])`,{timeout:15000});
  await page.click(selector);
}
module.exports={startLiveGame,resolvePendingWeeklyDecisions};
