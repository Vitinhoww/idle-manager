import { app, BrowserWindow, ipcMain, WebContentsView } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import { createStore } from './store.js'
import { autoUpdater } from 'electron-updater'

// Dev e producao usam pastas separadas — testar em dev nunca toca no cache do .exe instalado
const BASE = app.isPackaged
  ? 'D:\\IdleManagerData\\prod'
  : 'D:\\IdleManagerData\\dev'

app.setPath('userData',     path.join(BASE, 'userData'))
app.setPath('sessionData',  path.join(BASE, 'sessions'))
app.setPath('temp',         path.join(BASE, 'temp'))
app.setPath('logs',         path.join(BASE, 'logs'))
app.setPath('crashDumps',   path.join(BASE, 'crashes'))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

app.commandLine.appendSwitch('max-fps', '120')
app.commandLine.appendSwitch('disable-background-timer-throttling')
app.commandLine.appendSwitch('disable-renderer-backgrounding')
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows')
app.commandLine.appendSwitch('max-active-webgl-contexts', '8')
app.commandLine.appendSwitch('force-gpu-rasterization')

const COLOR_PALETTE = ['#e53935','#1565c0','#2e7d32','#f57c00','#6a1b9a','#00838f','#558b2f','#c62828','#ad1457','#0277bd']

function makeExecution(execId, name, accounts) {
  return {
    id: execId,
    name,
    accounts: accounts || [
      { id: `${execId}-s1`, label: 'Conta 1', gameName: 'Sigma Project',      color: COLOR_PALETTE[0], url: 'https://sigmaproject.online/en',          active: true },
      { id: `${execId}-s2`, label: 'Conta 2', gameName: 'Sigma Project',      color: COLOR_PALETTE[0], url: 'https://sigmaproject.online/en',          active: true },
      { id: `${execId}-s3`, label: 'Conta 3', gameName: 'Grand Line Idleverse', color: COLOR_PALETTE[1], url: 'https://grandline.idleverse.online/play', active: true },
      { id: `${execId}-s4`, label: 'Conta 4', gameName: 'Grand Line Idleverse', color: COLOR_PALETTE[1], url: 'https://grandline.idleverse.online/play', active: true }
    ]
  }
}

// Converte formato antigo (game: 'sigma') para novo (gameName, color)
const LEGACY_GAME_MAP = {
  sigma:     { gameName: 'Sigma Project',       color: COLOR_PALETTE[0] },
  grandline: { gameName: 'Grand Line Idleverse', color: COLOR_PALETTE[1] }
}

function migrateAccounts(accounts) {
  return accounts.map(a => {
    if (a.gameName) return a  // ja migrado
    const legacy = LEGACY_GAME_MAP[a.game] || { gameName: a.game || 'Jogo', color: COLOR_PALETTE[0] }
    const { game, ...rest } = a
    return { ...rest, gameName: legacy.gameName, color: legacy.color }
  })
}

const store = createStore({
  executions: [makeExecution('exec-1', 'Execucao 1')],
  activeExecutionId: 'exec-1',
  windowBounds: { width: 1600, height: 900 }
})

function migrateStore() {
  const data = store.getAll()
  if (!data.executions && data.accounts) {
    store.set('executions', [{
      id: 'exec-1',
      name: 'Execucao 1',
      accounts: migrateAccounts(data.accounts)
    }])
    store.set('activeExecutionId', 'exec-1')
  } else if (data.executions) {
    // Migra execucoes que ainda tenham formato antigo
    const migrated = data.executions.map(e => ({
      ...e,
      accounts: migrateAccounts(e.accounts)
    }))
    store.set('executions', migrated)
  }
}

migrateStore()

let mainWindow
const gameViews = {}

function getActiveExecution() {
  const executions = store.get('executions')
  const activeId = store.get('activeExecutionId')
  return executions.find(e => e.id === activeId) || executions[0]
}

function createMainWindow() {
  const { width, height } = store.get('windowBounds')

  mainWindow = new BrowserWindow({
    width, height,
    minWidth: 1200, minHeight: 700,
    title: 'Idle Manager',
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  const onResize = () => {
    const [w, h] = mainWindow.getSize()
    store.set('windowBounds', { width: w, height: h })
    repositionViews()
  }

  mainWindow.on('resized', onResize)
  mainWindow.on('maximize', onResize)
  mainWindow.on('unmaximize', onResize)
  mainWindow.on('restore', onResize)

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.webContents.once('did-finish-load', createGameViews)
}

function getGridLayout() {
  const [winW, winH] = mainWindow.getContentSize()
  const sidebarW = 220
  const headerH = 48
  const gap = 2
  const availW = winW - sidebarW
  const availH = winH - headerH
  const tileW = Math.floor((availW - gap) / 2)
  const tileH = Math.floor((availH - gap) / 2)
  return [
    { x: sidebarW,               y: headerH,               w: tileW, h: tileH },
    { x: sidebarW + tileW + gap, y: headerH,               w: tileW, h: tileH },
    { x: sidebarW,               y: headerH + tileH + gap, w: tileW, h: tileH },
    { x: sidebarW + tileW + gap, y: headerH + tileH + gap, w: tileW, h: tileH }
  ]
}

function createGameViews() {
  const exec = getActiveExecution()
  const layout = getGridLayout()
  exec.accounts.forEach((account, index) => {
    if (!account.active) return
    const partition = `persist:${account.id}`
    const view = new WebContentsView({
      webPreferences: { partition, contextIsolation: true, backgroundThrottling: false, nodeIntegration: false }
    })
    mainWindow.contentView.addChildView(view)
    const pos = layout[index]
    view.setBounds({ x: pos.x, y: pos.y, width: pos.w, height: pos.h })
    view.webContents.loadURL(account.url)
    gameViews[account.id] = view
  })
}

function destroyGameViews() {
  Object.values(gameViews).forEach(v => mainWindow.contentView.removeChildView(v))
  Object.keys(gameViews).forEach(k => delete gameViews[k])
}

function repositionViews() {
  const exec = getActiveExecution()
  const layout = getGridLayout()
  exec.accounts.forEach((account, index) => {
    const view = gameViews[account.id]
    if (!view) return
    const pos = layout[index]
    view.setBounds({ x: pos.x, y: pos.y, width: pos.w, height: pos.h })
  })
}

// IPC

ipcMain.handle('get-state', () => ({
  executions: store.get('executions'),
  activeExecutionId: store.get('activeExecutionId')
}))

ipcMain.handle('switch-execution', (_, execId) => {
  const executions = store.get('executions')
  if (!executions.find(e => e.id === execId)) return false
  store.set('activeExecutionId', execId)
  destroyGameViews()
  createGameViews()
  return true
})

ipcMain.handle('save-execution-accounts', (_, execId, accounts) => {
  const executions = store.get('executions')
  store.set('executions', executions.map(e => e.id === execId ? { ...e, accounts } : e))
  if (execId === store.get('activeExecutionId')) {
    destroyGameViews()
    createGameViews()
  }
  return true
})

ipcMain.handle('create-execution', (_, name) => {
  const executions = store.get('executions')
  const id = `exec-${Date.now()}`
  store.set('executions', [...executions, makeExecution(id, name)])
  return id
})

ipcMain.handle('rename-execution', (_, execId, name) => {
  const executions = store.get('executions')
  store.set('executions', executions.map(e => e.id === execId ? { ...e, name } : e))
  return true
})

ipcMain.handle('delete-execution', (_, execId) => {
  const executions = store.get('executions')
  if (executions.length <= 1) return false
  const updated = executions.filter(e => e.id !== execId)
  store.set('executions', updated)
  if (store.get('activeExecutionId') === execId) {
    store.set('activeExecutionId', updated[0].id)
    destroyGameViews()
    createGameViews()
  }
  return true
})

ipcMain.handle('reload-account', (_, accountId) => {
  gameViews[accountId]?.webContents.reload()
})

ipcMain.handle('toggle-mute', (_, accountId) => {
  const view = gameViews[accountId]
  if (!view) return false
  const muted = view.webContents.isAudioMuted()
  view.webContents.setAudioMuted(!muted)
  return !muted
})

ipcMain.handle('hide-views', () => {
  Object.values(gameViews).forEach(v => v.setBounds({ x: -9999, y: -9999, width: 1, height: 1 }))
})

ipcMain.handle('show-views', () => repositionViews())

ipcMain.handle('open-devtools', (_, accountId) => {
  gameViews[accountId]?.webContents.openDevTools({ mode: 'detach' })
})

ipcMain.handle('set-zoom', (_, accountId, factor) => {
  const view = gameViews[accountId]
  if (!view) return
  const clamped = Math.min(Math.max(factor, 0.25), 3.0)
  view.webContents.setZoomFactor(clamped)
  return clamped
})

ipcMain.handle('get-zoom', (_, accountId) => {
  return gameViews[accountId]?.webContents.getZoomFactor() ?? 1
})

// Auto-update — so funciona no .exe instalado (nao em dev)
function setupAutoUpdater() {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info.version)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    // Silencioso — nao incomodar o utilizador com erros de rede
    console.error('AutoUpdater error:', err.message)
  })

  // Verificar ao iniciar e depois a cada 2 horas
  autoUpdater.checkForUpdates()
  setInterval(() => autoUpdater.checkForUpdates(), 2 * 60 * 60 * 1000)
}

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})

app.whenReady().then(() => {
  createMainWindow()
  setupAutoUpdater()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
