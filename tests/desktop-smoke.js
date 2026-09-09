// Lightweight Electron smoke coverage for unpackaged development and the made desktop ZIP.
// The invoking script is responsible for building index.html or the Alpha artifact first.
const assert = require('assert/strict');
const {execFileSync} = require('child_process');
const extract = require('extract-zip');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const {chromium, _electron: electron} = require('playwright-core');
const {startNewDynasty} = require('./helpers/start-new-dynasty');

const root = path.join(__dirname, '..');
const electronPath = require('electron');
const packaged = process.argv.includes('--packaged');
const packagedTarget = process.platform === 'win32'
  ? {platform: 'win32', arch: 'x64', name: 'Dynasty-Lab-Desktop-Alpha-Windows-x64.zip'}
  : {platform: 'darwin', arch: 'arm64', name: 'Dynasty-Lab-Desktop-Alpha-macOS-arm64.zip'};
const artifact = path.join(root, 'out', 'make', 'zip', packagedTarget.platform,
  packagedTarget.arch, packagedTarget.name);
const bridgeKeys = ['kind', 'listSlots', 'load', 'readArchive', 'readGames', 'rename', 'save'];

async function extractPackagedBundle(destinationRoot) {
  assert.ok(['darwin', 'win32'].includes(process.platform),
    'the packaged Alpha smoke test requires macOS or Windows');
  assert.equal(fs.existsSync(artifact), true, `packaged Alpha ZIP is required at ${artifact}`);
  fs.mkdirSync(destinationRoot, {recursive: true});
  await extract(artifact, {dir: destinationRoot});

  if (process.platform === 'win32') {
    // cross-zip uses CreateFromDirectory on Windows, which puts the packaged
    // directory's contents at the archive root instead of retaining its name.
    const executable = path.join(destinationRoot, 'Dynasty Lab.exe');
    const asar = path.join(destinationRoot, 'resources', 'app.asar');
    assert.equal(fs.existsSync(executable), true, `packaged executable is required at ${executable}`);
    assert.equal(fs.existsSync(asar), true, `packaged ASAR is required at ${asar}`);
    return executable;
  }

  const bundle = path.join(destinationRoot, 'Dynasty Lab.app');
  const executable = path.join(bundle, 'Contents', 'MacOS', 'Dynasty Lab');
  const plist = path.join(bundle, 'Contents', 'Info.plist');
  assert.equal(fs.existsSync(executable), true, `packaged executable is required at ${executable}`);
  const plistValue = key => execFileSync('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, plist],
    {encoding: 'utf8'}).trim();
  assert.equal(plistValue('CFBundleName'), 'Dynasty Lab', 'packaged app keeps its established name');
  assert.equal(plistValue('CFBundleExecutable'), 'Dynasty Lab', 'packaged executable keeps its established name');
  assert.equal(plistValue('CFBundleIdentifier'), 'com.electron.dynasty-lab',
    'packaged app keeps its established bundle identity');
  execFileSync('codesign', ['--verify', '--deep', '--strict', bundle]);
  return bundle;
}

function availablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const {port} = server.address();
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForEndpoint(url, wanted, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    let available = false;
    try {
      const response = await fetch(url);
      available = response.ok;
    } catch {}
    if (available === wanted) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for packaged app endpoint to ${wanted ? 'open' : 'close'}: ${url}`);
}

async function launchMacBundle(bundle, profile, applicationArgs = []) {
  const port = await availablePort();
  const endpoint = `http://127.0.0.1:${port}`;
  execFileSync('open', [
    '-n', bundle, '--args', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`,
    ...applicationArgs,
  ]);
  await waitForEndpoint(`${endpoint}/json/version`, true);
  const browser = await chromium.connectOverCDP(endpoint);
  const page = browser.contexts().flatMap(context => context.pages())[0];
  assert.ok(page, 'packaged app must expose its renderer page');
  const listenerPid = Number(execFileSync('lsof', [
    '-n', '-P', `-iTCP:${port}`, '-sTCP:LISTEN', '-t',
  ], {encoding: 'utf8'}).trim().split('\n')[0]);
  assert.ok(Number.isInteger(listenerPid) && listenerPid > 1,
    'the desktop app process must own its debugging endpoint');
  return {
    page,
    close: async () => {
      await browser.close().catch(() => {});
      try { process.kill(listenerPid, 'SIGTERM'); } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
      await waitForEndpoint(`${endpoint}/json/version`, false);
    },
  };
}

async function launchPackagedApplication(application, profile) {
  if (process.platform === 'darwin') return launchMacBundle(application, profile);

  const app = await electron.launch({
    executablePath: application,
    args: [`--user-data-dir=${profile}`],
    cwd: path.dirname(application),
  });
  assert.equal(fs.realpathSync(await app.evaluate(({app: runtime}) => runtime.getPath('userData'))),
    fs.realpathSync(profile), 'packaged smoke test must use its disposable Electron profile');
  return {
    page: await app.firstWindow(),
    close: () => app.close(),
  };
}

function watchPage(page, pageErrors, consoleErrors) {
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
}

async function verifyRenderer(page) {
  await page.waitForFunction(() => document.querySelector('#titleTeam')?.options.length > 0, {timeout: 60000});
  assert.match(await page.title(), /Dynasty Lab/i);
  assert.equal(await page.evaluate(() => location.protocol), 'file:');
  assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
  const rendererStorage = await page.evaluate(() => ({
    adapterKind: window.DynastyStorage?.kind,
    bridgeKind: window.DynastyDesktopStorage?.kind,
    bridgeKeys: Object.keys(window.DynastyDesktopStorage || {}).sort(),
  }));
  assert.equal(rendererStorage.adapterKind, 'desktop', 'renderer selects the desktop storage adapter');
  assert.equal(rendererStorage.bridgeKind, 'desktop', 'narrow preload storage bridge is present');
  assert.deepEqual(rendererStorage.bridgeKeys, bridgeKeys,
    'preload exposes only named desktop storage capabilities');
  assert.equal(await page.locator('#titleNew').isVisible(), true, 'title screen is visible');
}

async function startAndSave(page, profile) {
  await startNewDynasty(page, {beginSeason: false});
  assert.equal(await page.locator('#app').isVisible(), true, 'new dynasty reaches the application');
  assert.equal(await page.locator('#titleScreen').isVisible(), false, 'title screen closes after starting');
  assert.ok(await page.locator('#userTeam option').count() > 0, 'team selector is populated');
  assert.match(await page.locator('#weekLine').innerText(), /Preseason/,
    'desktop creation opens at the preseason checkpoint');
  assert.equal(await page.locator('#hubAdvance').innerText(), 'Begin Season',
    'desktop creation exposes the explicit season boundary');
  await page.click('[data-client-tab="roster"]');
  await page.locator('#roster.active').waitFor({state: 'visible', timeout: 10000});
  const staffRead = await page.locator('#rosterPositionBoard .rd-player small').first().innerText();
  assert.match(staffRead, /^[A-Z]+ · [A-F][+-]? · \d+–\d+$/,
    'roster card renders its scouting range without escaped HTML');
  await page.locator('#rosterPositionBoard [data-rd-player]').first().click();
  await page.locator('#playerDialog[open] #playerIdentityHero').waitFor({state: 'visible', timeout: 10000});
  const profileRead = await page.locator('#playerIdentityHero .pi-evaluation .pi-stat strong').first().innerText();
  assert.match(profileRead, /^[A-F][+-]? · \d+–\d+$/,
    'player dossier renders its scouting range without escaped HTML');
  await page.locator('#playerDialog .dialog-close').click();
  await page.locator('#playerDialog').waitFor({state: 'hidden', timeout: 10000});
  await page.locator('#saveBrowser').evaluate(button => button.click());
  await page.waitForFunction(() => /^Saved /.test(document.querySelector('#saveStatus')?.textContent || ''), {timeout: 30000});
  assert.match(await page.locator('#saveStatus').textContent(), /on this computer\.$/);
  const nativeSave = path.join(profile, 'Saves', 'Dynasty 1', 'dynasty.json');
  assert.equal(fs.existsSync(nativeSave), true, 'save is committed to the desktop profile');
  const nativeWrapper = JSON.parse(fs.readFileSync(nativeSave, 'utf8'));
  assert.equal(nativeWrapper.formatVersion, 1);
  assert.equal(nativeWrapper.slot, 'main');
  assert.equal(nativeWrapper.core.storageVersion, 3);
  assert.equal(nativeWrapper.core.userTeam, 'Chicago Metropolitan');
  assert.equal(nativeWrapper.core.universe.phase, 'preseason',
    'native saves preserve the opening preseason phase');
}

async function restoreSave(page) {
  await page.waitForFunction(() => !document.querySelector('#titleContinue')?.disabled, {timeout: 60000});
  await page.click('#titleContinue');
  await page.locator('#app').waitFor({state: 'visible', timeout: 30000});
  assert.match(await page.locator('#teamName').textContent(), /Chicago Metropolitan/i);
  assert.match(await page.locator('#weekLine').innerText(), /Preseason/,
    'desktop restart restores the preseason checkpoint');
  assert.equal(await page.locator('#hubAdvance').innerText(), 'Begin Season');
}

async function runUnpackaged(profile, pageErrors, consoleErrors) {
  assert.equal(fs.existsSync(path.join(root, 'index.html')), true, 'built index.html is required');
  const mainSource = fs.readFileSync(path.join(root, 'desktop', 'main.js'), 'utf8');
  assert.match(mainSource, /contextIsolation:\s*true/, 'renderer context isolation is configured');
  assert.match(mainSource, /nodeIntegration:\s*false/, 'renderer Node integration is disabled');
  assert.match(mainSource, /sandbox:\s*true/, 'renderer sandbox is configured');

  // Recent macOS releases require GUI applications to register through
  // LaunchServices. Launch the development Electron bundle the same way a user
  // starts the made app, while retaining Playwright's direct launch elsewhere.
  if (process.platform === 'darwin') {
    const electronBundle = path.dirname(path.dirname(path.dirname(electronPath)));
    let launched;
    try {
      launched = await launchMacBundle(electronBundle, profile, [root]);
      watchPage(launched.page, pageErrors, consoleErrors);
      await verifyRenderer(launched.page);
      await startAndSave(launched.page, profile);
      await launched.close();
      launched = await launchMacBundle(electronBundle, profile, [root]);
      watchPage(launched.page, pageErrors, consoleErrors);
      await restoreSave(launched.page);
    } finally {
      if (launched) await launched.close();
    }
    return;
  }

  const launch = () => electron.launch({
    executablePath: electronPath,
    args: [`--user-data-dir=${profile}`, root],
    cwd: root,
  });
  let app;
  try {
    app = await launch();
    assert.equal(fs.realpathSync(await app.evaluate(({app}) => app.getPath('userData'))),
      fs.realpathSync(profile), 'smoke test must use its disposable Electron profile');
    const preferences = await app.evaluate(({BrowserWindow}) =>
      BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences());
    assert.equal(preferences.contextIsolation, true, 'renderer context isolation is enabled');
    assert.equal(preferences.nodeIntegration, false, 'renderer Node integration is disabled');
    assert.equal(preferences.sandbox, true, 'renderer sandbox is enabled');
    const page = await app.firstWindow();
    watchPage(page, pageErrors, consoleErrors);
    await verifyRenderer(page);
    await startAndSave(page, profile);
    await app.close();
    app = await launch();
    const restoredPage = await app.firstWindow();
    watchPage(restoredPage, pageErrors, consoleErrors);
    await restoreSave(restoredPage);
  } finally {
    if (app) await app.close();
  }
}

async function runPackaged(smokeRoot, profile, pageErrors, consoleErrors) {
  let launched;
  try {
    const firstRoot = path.join(smokeRoot, 'first');
    const firstBundle = await extractPackagedBundle(firstRoot);
    launched = await launchPackagedApplication(firstBundle, profile);
    watchPage(launched.page, pageErrors, consoleErrors);
    const packagedUrl = decodeURIComponent(await launched.page.evaluate(() => location.href));
    assert.equal(packagedUrl.startsWith(`file://${root}`), false,
      'packaged app must run outside the repository');
    assert.match(packagedUrl, /app\.asar\/index\.html$/,
      'packaged app must load the game from its own ASAR');
    await verifyRenderer(launched.page);
    await startAndSave(launched.page, profile);
    await launched.close();
    launched = null;

    fs.rmSync(firstRoot, {recursive: true, force: true});
    const replacementBundle = await extractPackagedBundle(path.join(smokeRoot, 'replacement'));
    launched = await launchPackagedApplication(replacementBundle, profile);
    watchPage(launched.page, pageErrors, consoleErrors);
    await restoreSave(launched.page);
  } finally {
    if (launched) await launched.close();
  }
}

(async () => {
  const smokeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dynasty-lab-desktop-smoke-'));
  const profile = path.join(smokeRoot, 'profile');
  const pageErrors = [];
  const consoleErrors = [];
  try {
    if (packaged) await runPackaged(smokeRoot, profile, pageErrors, consoleErrors);
    else await runUnpackaged(profile, pageErrors, consoleErrors);
    assert.deepEqual(pageErrors, [], `fatal renderer errors: ${pageErrors.join(' | ')}`);
    assert.deepEqual(consoleErrors, [], `renderer console errors: ${consoleErrors.join(' | ')}`);
    console.log(`PASS ${packaged ? `made ${process.platform === 'win32' ? 'Windows' : 'macOS'} Alpha` : 'desktop shell'} uses native storage, saves, replaces/restarts, restores, and closes cleanly`);
  } finally {
    fs.rmSync(smokeRoot, {recursive: true, force: true});
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
