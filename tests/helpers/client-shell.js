// Clicks a control that lives in the client shell's "Dynasty & Saves" utilities, opening the
// mobile rail and the utilities disclosure first the way a player would.
async function clickShellUtility(page, selector) {
  const shell = page.locator('#clientRail');
  if (await shell.count()) {
    const quick = page.locator('.client-mobile-nav');
    if (await quick.count() && await quick.isVisible() && !await page.$eval('#app', el => el.classList.contains('client-rail-open')))
      await page.click('[data-client-more]');
    const details = page.locator('.client-utilities');
    if (await details.count() && !await details.evaluate(el => el.open)) await details.locator('summary').click();
  }
  await page.locator(selector).click();
}

module.exports = { clickShellUtility };
