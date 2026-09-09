const path = require('path');
const { pathToFileURL } = require('url');
const { app, BrowserWindow, ipcMain, session } = require('electron');
const { createDesktopStorage } = require('./storage.js');

const GAME_ENTRY = path.join(__dirname, '..', 'index.html');
const GAME_URL = pathToFileURL(GAME_ENTRY).href;
const PRELOAD_ENTRY = path.join(__dirname, 'preload.js');
let mainWindow = null;

function validateIpcSender(event) {
  const frame = event.senderFrame;
  if (!mainWindow || event.sender !== mainWindow.webContents || !frame
    || frame !== event.sender.mainFrame || frame.url !== GAME_URL)
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
