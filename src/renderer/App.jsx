import React, { useState, useEffect, useMemo } from 'react'
import Sidebar from './components/Sidebar'
import SettingsModal from './components/SettingsModal'
import ExecutionsModal from './components/ExecutionsModal'

export default function App() {
  const [executions, setExecutions] = useState([])
  const [activeExecutionId, setActiveExecutionId] = useState(null)
  const [mutedMap, setMutedMap] = useState({})
  const [showSettings, setShowSettings] = useState(false)
  const [showExecutions, setShowExecutions] = useState(false)
  const [updateVersion, setUpdateVersion] = useState(null)
  const [updateReady, setUpdateReady] = useState(false)

  const activeExecution = executions.find(e => e.id === activeExecutionId)
  const accounts = activeExecution?.accounts || []

  // Colecta todos os jogos unicos de todas as execucoes (para sugestoes)
  const knownGames = useMemo(() => {
    const map = {}
    executions.forEach(exec => {
      exec.accounts.forEach(acc => {
        if (acc.gameName && !map[acc.gameName]) {
          map[acc.gameName] = { gameName: acc.gameName, url: acc.url, color: acc.color }
        }
      })
    })
    return Object.values(map)
  }, [executions])

  useEffect(() => {
    window.idleAPI.getState().then(({ executions, activeExecutionId }) => {
      setExecutions(executions)
      setActiveExecutionId(activeExecutionId)
    })
    window.idleAPI.onUpdateAvailable((version) => setUpdateVersion(version))
    window.idleAPI.onUpdateDownloaded(() => setUpdateReady(true))
  }, [])

  const handleReload = (id) => window.idleAPI.reloadAccount(id)

  const handleMute = async (id) => {
    const muted = await window.idleAPI.toggleMute(id)
    setMutedMap(m => ({ ...m, [id]: muted }))
  }

  const openSettings = async () => {
    await window.idleAPI.hideViews()
    setShowSettings(true)
  }

  const closeSettings = async () => {
    setShowSettings(false)
    await window.idleAPI.showViews()
  }

  const handleSaveAccounts = async (updated) => {
    await window.idleAPI.saveExecutionAccounts(activeExecutionId, updated)
    setExecutions(prev => prev.map(e => e.id === activeExecutionId ? { ...e, accounts: updated } : e))
    setShowSettings(false)
    await window.idleAPI.showViews()
  }

  const openExecutions = async () => {
    await window.idleAPI.hideViews()
    setShowExecutions(true)
  }

  const closeExecutions = async () => {
    setShowExecutions(false)
    await window.idleAPI.showViews()
  }

  const handleSwitchExecution = async (execId) => {
    await window.idleAPI.switchExecution(execId)
    setActiveExecutionId(execId)
    setMutedMap({})
    setShowExecutions(false)
    await window.idleAPI.showViews()
  }

  const handleCreateExecution = async (name) => {
    await window.idleAPI.createExecution(name)
    const state = await window.idleAPI.getState()
    setExecutions(state.executions)
  }

  const handleRenameExecution = async (execId, name) => {
    await window.idleAPI.renameExecution(execId, name)
    setExecutions(prev => prev.map(e => e.id === execId ? { ...e, name } : e))
  }

  const handleDeleteExecution = async (execId) => {
    const ok = await window.idleAPI.deleteExecution(execId)
    if (ok) {
      const state = await window.idleAPI.getState()
      setExecutions(state.executions)
      setActiveExecutionId(state.activeExecutionId)
      setMutedMap({})
    }
  }

  return (
    <div style={styles.root}>
      {updateReady && (
        <div style={styles.updateBanner}>
          Actualizacao {updateVersion} pronta
          <button style={styles.updateBtn} onClick={() => window.idleAPI.installUpdate()}>
            Instalar e Reiniciar
          </button>
        </div>
      )}
      {updateVersion && !updateReady && (
        <div style={{ ...styles.updateBanner, background: '#1a2a1a' }}>
          A transferir actualizacao {updateVersion}...
        </div>
      )}

      <div style={styles.header}>
        <span style={styles.headerTitle}>Idle Manager</span>
        <span style={styles.execBadge} onClick={openExecutions} title="Gerir execucoes">
          {activeExecution?.name || '...'} v
        </span>
        <span style={styles.headerFps}>120 FPS</span>
        <button style={styles.settingsBtn} onClick={openSettings}>Contas</button>
      </div>

      <Sidebar
        accounts={accounts}
        mutedMap={mutedMap}
        onReload={handleReload}
        onMute={handleMute}
        onDevtools={(id) => window.idleAPI.openDevtools(id)}
      />

      <div style={styles.gridArea}>
        {accounts.length === 0 && (
          <div style={styles.emptyState}>
            <p>Nenhuma conta configurada.</p>
            <button style={styles.settingsBtn} onClick={openSettings}>Configurar contas</button>
          </div>
        )}
        <div style={styles.grid}>
          {accounts.map((acc) => (
            <div key={acc.id} style={{ ...styles.tileLabel, borderColor: acc.color || '#444' }}>
              <span style={{ ...styles.tileBadge, background: acc.color || '#444' }}>
                {acc.gameName || acc.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          accounts={accounts}
          knownGames={knownGames}
          onSave={handleSaveAccounts}
          onClose={closeSettings}
        />
      )}

      {showExecutions && (
        <ExecutionsModal
          executions={executions}
          activeExecutionId={activeExecutionId}
          onSwitch={handleSwitchExecution}
          onCreate={handleCreateExecution}
          onRename={handleRenameExecution}
          onDelete={handleDeleteExecution}
          onClose={closeExecutions}
        />
      )}
    </div>
  )
}

const styles = {
  root: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', width: '100vw',
    background: '#0f0f0f', overflow: 'hidden'
  },
  header: {
    height: 48, background: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
    display: 'flex', alignItems: 'center',
    padding: '0 16px', gap: 10, flexShrink: 0,
    WebkitAppRegion: 'drag'
  },
  headerTitle: { fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: 0.5, flex: 1 },
  execBadge: {
    fontSize: 12, color: '#ccc',
    background: '#252525', border: '1px solid #3a3a3a',
    borderRadius: 5, padding: '3px 10px',
    cursor: 'pointer', WebkitAppRegion: 'no-drag',
    maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  headerFps: {
    fontSize: 12, color: '#4caf50', fontWeight: 600,
    background: '#1b2b1b', padding: '2px 8px', borderRadius: 4
  },
  settingsBtn: {
    background: '#2a2a2a', color: '#fff',
    border: '1px solid #444', borderRadius: 6,
    padding: '4px 12px', cursor: 'pointer',
    fontSize: 13, WebkitAppRegion: 'no-drag'
  },
  gridArea: { flex: 1, display: 'flex', marginLeft: 220, position: 'relative' },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
    gap: 2, width: '100%', height: '100%', pointerEvents: 'none'
  },
  tileLabel: {
    border: '1px solid #333', borderRadius: 2,
    display: 'flex', alignItems: 'flex-start',
    padding: 6, pointerEvents: 'none'
  },
  tileBadge: {
    fontSize: 11, fontWeight: 600, padding: '2px 8px',
    borderRadius: 4, color: '#fff', opacity: 0.85
  },
  updateBanner: {
    background: '#1b3a1b', color: '#a5d6a7',
    fontSize: 12, padding: '6px 16px',
    display: 'flex', alignItems: 'center', gap: 12,
    flexShrink: 0
  },
  updateBtn: {
    background: '#2e7d32', border: 'none',
    color: '#fff', borderRadius: 5,
    padding: '3px 12px', cursor: 'pointer',
    fontSize: 12, fontWeight: 600
  },
  emptyState: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 16, color: '#888'
  }
}
