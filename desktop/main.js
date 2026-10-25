const fs = require('fs');
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
