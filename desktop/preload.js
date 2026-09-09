const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('DynastyDesktopStorage', Object.freeze({
  kind: 'desktop',
  load: payload => invoke('dynasty-storage:load', payload),
  readArchive: payload => invoke('dynasty-storage:read-archive', payload),
  readGames: payload => invoke('dynasty-storage:read-games', payload),
  save: payload => invoke('dynasty-storage:save', payload),
  listSlots: () => invoke('dynasty-storage:list-slots'),
  rename: payload => invoke('dynasty-storage:rename', payload),
}));
