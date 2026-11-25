import React, { useState } from 'react'

export default function Sidebar({ accounts, mutedMap, onReload, onMute, onDevtools }) {
  const [zoomMap, setZoomMap] = useState({})

  const changeZoom = async (id, delta) => {
    const current = zoomMap[id] ?? 1
    const next = Math.min(Math.max(current + delta, 0.25), 3.0)
    const actual = await window.idleAPI.setZoom(id, next)
    setZoomMap(m => ({ ...m, [id]: actual }))
  }

  const resetZoom = async (id) => {
    await window.idleAPI.setZoom(id, 1)
    setZoomMap(m => ({ ...m, [id]: 1 }))
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.sectionTitle}>Contas</div>
      {accounts.map((acc) => {
        const color = acc.color || '#888'
        const zoom = zoomMap[acc.id] ?? 1
        return (
          <div key={acc.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={{ ...styles.dot, background: color }} />
              <span style={styles.label}>{acc.label}</span>
            </div>
            <div style={styles.gameName}>{acc.gameName || '—'}</div>
            <div style={styles.actions}>
              <button style={styles.btn} onClick={() => onReload(acc.id)} title="Recarregar">R</button>
              <button
                style={{ ...styles.btn, color: mutedMap[acc.id] ? '#f44' : '#aaa' }}
                onClick={() => onMute(acc.id)}
                title={mutedMap[acc.id] ? 'Activar som' : 'Silenciar'}
              >
                {mutedMap[acc.id] ? 'M' : 'S'}
              </button>
              <button style={styles.btn} onClick={() => onDevtools(acc.id)} title="DevTools">D</button>
            </div>
            <div style={styles.zoomRow}>
              <button style={styles.zoomBtn} onClick={() => changeZoom(acc.id, -0.1)}>-</button>
              <span style={styles.zoomLabel} onClick={() => resetZoom(acc.id)} title="Reset zoom">
                {Math.round(zoom * 100)}%
              </span>
              <button style={styles.zoomBtn} onClick={() => changeZoom(acc.id, +0.1)}>+</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  sidebar: {
    position: 'fixed', left: 0, top: 48, bottom: 0, width: 220,
    background: '#161616', borderRight: '1px solid #2a2a2a',
    overflowY: 'auto', padding: '12px 8px',
    display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#666',
    textTransform: 'uppercase', letterSpacing: 1, padding: '0 4px 4px'
  },
  card: {
    background: '#1e1e1e', borderRadius: 8,
    padding: '10px 10px 8px', border: '1px solid #2a2a2a',
    display: 'flex', flexDirection: 'column', gap: 4
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  label: { fontWeight: 600, fontSize: 13, color: '#eee' },
  gameName: { fontSize: 11, color: '#888', paddingLeft: 14 },
  actions: { display: 'flex', gap: 4, marginTop: 4 },
  btn: {
    flex: 1, background: '#2a2a2a', border: '1px solid #333',
    borderRadius: 5, color: '#ccc', cursor: 'pointer',
    padding: '4px 0', fontSize: 12
  },
  zoomRow: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 },
  zoomBtn: {
    width: 28, height: 24, background: '#2a2a2a', border: '1px solid #333',
    borderRadius: 5, color: '#ccc', cursor: 'pointer', fontSize: 16, lineHeight: 1, flexShrink: 0
  },
  zoomLabel: {
    flex: 1, textAlign: 'center', fontSize: 11, color: '#888',
    cursor: 'pointer', userSelect: 'none'
  }
}
