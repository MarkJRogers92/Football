const path = require('path');
const { pathToFileURL } = require('url');
const { app, BrowserWindow, session } = require('electron');

const GAME_ENTRY = path.join(__dirname, '..', 'index.html');

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
    },
  });

  const allowedUrl = pathToFileURL(GAME_ENTRY).href;
  window.on('page-title-updated', event => event.preventDefault());
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== allowedUrl) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  window.loadFile(GAME_ENTRY);
  return window;
}

app.whenReady().then(() => {
  // Milestone A has no desktop bridge. Deny permission prompts until a future
  // feature adds a narrowly scoped, explicit permission flow.
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
