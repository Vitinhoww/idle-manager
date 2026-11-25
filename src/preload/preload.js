import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('idleAPI', {
  onUpdateAvailable:  (cb) => ipcRenderer.on('update-available',  (_, version) => cb(version)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', () => cb()),
  installUpdate:      ()    => ipcRenderer.invoke('install-update'),
  getState:              ()                 => ipcRenderer.invoke('get-state'),
  switchExecution:       (id)               => ipcRenderer.invoke('switch-execution', id),
  saveExecutionAccounts: (execId, accounts) => ipcRenderer.invoke('save-execution-accounts', execId, accounts),
  createExecution:       (name)             => ipcRenderer.invoke('create-execution', name),
  renameExecution:       (execId, name)     => ipcRenderer.invoke('rename-execution', execId, name),
  deleteExecution:       (execId)           => ipcRenderer.invoke('delete-execution', execId),
  reloadAccount:         (id)               => ipcRenderer.invoke('reload-account', id),
  toggleMute:            (id)               => ipcRenderer.invoke('toggle-mute', id),
  openDevtools:          (id)               => ipcRenderer.invoke('open-devtools', id),
  setZoom:               (id, factor)       => ipcRenderer.invoke('set-zoom', id, factor),
  getZoom:               (id)               => ipcRenderer.invoke('get-zoom', id),
  hideViews:             ()                 => ipcRenderer.invoke('hide-views'),
  showViews:             ()                 => ipcRenderer.invoke('show-views')
})
