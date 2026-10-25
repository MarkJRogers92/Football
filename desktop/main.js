const fs = require('fs');
const https = require('https');
const path = require('path');
const {fileURLToPath, pathToFileURL} = require('url');
const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const { createDesktopStorage } = require('./storage.js');

const GAME_ENTRY = path.join(__dirname, '..', 'index.html');
const GAME_URL = pathToFileURL(GAME_ENTRY).href;
const PRELOAD_ENTRY = path.join(__dirname, 'preload.js');
let mainWindow = null;

// v0.12.10 — a packaged Alpha has no terminal to watch, so a renderer crash or a
// console error is otherwise invisible. Keep a bounded local log the player can
// attach to a bug report; never write it into the save directory.
const ERROR_LOG_MAX = 256 * 1024;
const errorLogFile = () => path.join(app.getPath('userData'), 'dynasty-lab-errors.log');
function recordError(kind, detail) {
  try {
    const file = errorLogFile();
    try { if (fs.statSync(file).size > ERROR_LOG_MAX) fs.renameSync(file, file + '.1'); } catch {}
    fs.appendFileSync(file, `${new Date().toISOString()} ${kind} ${String(detail || '').slice(0, 2000)}\n`);
  } catch {}
}
const ALLOWED_EXTERNAL = /^https:\/\/(github\.com\/MarkJRogers92\/Football|markjrogers92\.github\.io\/Football)/i;

// The update check runs in the main process, not the renderer: a blocked request
// must stay silent, and a renderer fetch would raise a console error the smoke
// test (correctly) treats as a regression.
// Desktop saves live in the app data folder, not in a browser origin, so the
// renderer's navigator.storage estimate says nothing useful about them.
function saveUsage() {
  let bytes = 0;
  const walk = dir => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) { try { bytes += fs.statSync(full).size; } catch {} }
    }
  };
  walk(path.join(app.getPath('userData'), 'Saves'));
  return { bytes };
}

function latestRelease() {
  return new Promise(resolve => {
    let settled = false;
    const done = value => { if (!settled) { settled = true; resolve(value); } };
    const request = https.get({
      host: 'api.github.com',
      path: '/repos/MarkJRogers92/Football/releases/latest',
      headers: { 'User-Agent': 'Dynasty-Lab', Accept: 'application/vnd.github+json' },
      timeout: 4000,
    }, response => {
      if (response.statusCode !== 200) { response.resume(); return done(null); }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { if (body.length < 200000) body += chunk; });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          done(data.tag_name ? { tag: data.tag_name, url: data.html_url || null } : null);
        } catch { done(null); }
      });
      response.on('error', () => done(null));
    });
    request.on('timeout', () => { request.destroy(); done(null); });
    request.on('error', () => done(null));
  });
}

function isGameEntryUrl(url) {
  try {
    const actual = path.resolve(fileURLToPath(url));
    const expected = path.resolve(GAME_ENTRY);
    return process.platform === 'win32'
      ? actual.toLowerCase() === expected.toLowerCase()
      : actual === expected;
  } catch {
    return false;
  }
}

function validateIpcSender(event) {
  const frame = event.senderFrame;
  if (!mainWindow || event.sender !== mainWindow.webContents || !frame
    || frame !== event.sender.mainFrame || !isGameEntryUrl(frame.url))
    throw new Error('Desktop storage request rejected.');
}

function registerStorageHandlers(store) {
  const handlers = {
    'dynasty-storage:load': 'load',
    'dynasty-storage:read-archive': 'readArchive',
    'dynasty-storage:read-games': 'readGames',
    'dynasty-storage:save': 'save',
    'dynasty-storage:list-slots': 'listSlots',
    'dynasty-storage:rename': 'rename',
  };
  for (const [channel, method] of Object.entries(handlers)) {
    ipcMain.handle(channel, (event, payload) => {
      validateIpcSender(event);
      return store[method](payload);
    });
  }
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    resizable: true,
    title: 'Dynasty Lab',
    backgroundColor: '#090d12',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: PRELOAD_ENTRY,
    },
  });

  window.on('page-title-updated', event => event.preventDefault());
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== GAME_URL) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('render-process-gone', (_event, details) => recordError('render-process-gone', JSON.stringify(details)));
  window.webContents.on('preload-error', (_event, preloadPath, error) => recordError('preload-error', `${preloadPath} ${error?.stack || error}`));
  window.on('unresponsive', () => recordError('unresponsive', 'the renderer stopped responding'));
  window.webContents.on('console-message', (...args) => {
    const first = args[0];
    const level = first && typeof first === 'object' ? first.level : args[1];
    const message = first && typeof first === 'object' ? first.message : args[2];
    if (level === 'error' || level === 3) recordError('console', message);
  });
  window.on('closed', () => { if (mainWindow === window) mainWindow = null; });

  window.loadFile(GAME_ENTRY);
  mainWindow = window;
  return window;
}

const ownsInstance = app.requestSingleInstanceLock();
if (!ownsInstance) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    const store = createDesktopStorage({rootDir: path.join(app.getPath('userData'), 'Saves')});
    registerStorageHandlers(store);
    ipcMain.handle('dynasty-storage:usage', event => {
      validateIpcSender(event);
      return saveUsage();
    });
    ipcMain.handle('dynasty-shell:latest-release', event => {
      validateIpcSender(event);
      return latestRelease();
    });
    ipcMain.handle('dynasty-shell:open-external', (event, payload) => {
      validateIpcSender(event);
      const url = String(payload?.url || '');
      if (!ALLOWED_EXTERNAL.test(url)) throw new Error('External link rejected.');
      return shell.openExternal(url);
    });
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
