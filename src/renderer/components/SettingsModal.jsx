import React, { useState } from 'react'

const COLOR_PALETTE = ['#e53935','#1565c0','#2e7d32','#f57c00','#6a1b9a','#00838f','#558b2f','#c62828','#ad1457','#0277bd']

// Extrai um nome legivel a partir de uma URL
function guessGameName(url) {
  try {
    const hostname = new URL(url).hostname  // ex: play.roclassicidle.com.br
    const parts = hostname.replace(/^www\./, '').split('.')
    // Pega a parte mais longa que nao seja subdominio comum nem TLD
    const skip = new Set(['play','game','games','app','web','www','com','net','org','br','io'])
    const main = parts.find(p => p.length > 3 && !skip.has(p)) || parts[0]
    // camelCase e kebab-case -> Title Case
    return main
      .replace(/-/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  } catch {
    return ''
  }
}

// Atribui uma cor da paleta com base no nome do jogo (consistente)
function colorForGame(gameName, knownGames) {
  const known = knownGames.find(g => g.gameName === gameName)
  if (known) return known.color
  // Nova cor: ciclica baseada no indice de jogos conhecidos
  return COLOR_PALETTE[knownGames.length % COLOR_PALETTE.length]
}

export default function SettingsModal({ accounts, knownGames, onSave, onClose }) {
  const [local, setLocal] = useState(accounts.map(a => ({ ...a })))

  const update = (index, field, value) => {
    setLocal(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  const handleUrlChange = (index, url) => {
    setLocal(prev => prev.map((a, i) => {
      if (i !== index) return a
      // Tenta preencher gameName automaticamente se ainda estiver vazio ou igual ao anterior guess
      const autoName = guessGameName(url)
      const prevAutoName = guessGameName(a.url)
      const shouldAutoFill = !a.gameName || a.gameName === prevAutoName
      const gameName = shouldAutoFill && autoName ? autoName : a.gameName
      const color = colorForGame(gameName, knownGames)
      return { ...a, url, gameName, color }
    }))
  }

  const handleGameNameChange = (index, gameName) => {
    const color = colorForGame(gameName, knownGames)
    setLocal(prev => prev.map((a, i) => i === index ? { ...a, gameName, color } : a))
    // Se o nome bate com um jogo conhecido, preenche a URL automaticamente
    const known = knownGames.find(g => g.gameName === gameName)
    if (known) {
      setLocal(prev => prev.map((a, i) => i === index ? { ...a, gameName, color: known.color, url: known.url } : a))
    }
  }

  // Nomes de jogos unicos para o datalist
  const gameNames = [...new Set(knownGames.map(g => g.gameName))].sort()

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <span style={S.title}>Configuracao de Contas</span>
          <button style={S.closeBtn} onClick={onClose}>x</button>
        </div>

        <div style={S.body}>
          {local.map((acc, i) => (
            <div key={acc.id} style={S.row}>
              <div style={{ ...S.colorBar, background: acc.color || '#555' }} />
              <div style={S.rowIndex}>{i + 1}</div>
              <div style={S.fields}>
                <div style={S.fieldRow}>
                  <div style={S.field}>
                    <label style={S.label}>Nome da conta</label>
                    <input
                      style={S.input}
                      value={acc.label}
                      onChange={e => update(i, 'label', e.target.value)}
                      placeholder="Ex: Principal, Alt 1..."
                    />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Jogo</label>
                    <input
                      style={S.input}
                      list={`games-list-${i}`}
                      value={acc.gameName || ''}
                      onChange={e => handleGameNameChange(i, e.target.value)}
                      placeholder="Nome do jogo"
                    />
                    <datalist id={`games-list-${i}`}>
                      {gameNames.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div style={S.field}>
                  <label style={S.label}>URL do jogo</label>
                  <input
                    style={S.input}
                    value={acc.url}
                    onChange={e => handleUrlChange(i, e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={S.footer}>
          <p style={S.note}>
            Jogos usados anteriormente aparecem como sugestoes no campo Jogo. URLs novas sao detectadas automaticamente.
          </p>
          <div style={S.footerBtns}>
            <button style={S.cancelBtn} onClick={onClose}>Cancelar</button>
            <button style={S.saveBtn} onClick={() => onSave(local)}>Guardar e Aplicar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100
  },
  modal: {
    background: '#1a1a1a', border: '1px solid #333',
    borderRadius: 12, width: 660,
    maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  header: {
    padding: '16px 20px', borderBottom: '1px solid #2a2a2a',
    display: 'flex', alignItems: 'center'
  },
  title: { flex: 1, fontWeight: 700, fontSize: 16, color: '#fff' },
  closeBtn: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18 },
  body: { overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  row: {
    display: 'flex', gap: 10, alignItems: 'stretch',
    background: '#222', borderRadius: 8, overflow: 'hidden',
    border: '1px solid #2a2a2a'
  },
  colorBar: { width: 4, flexShrink: 0 },
  rowIndex: {
    width: 24, height: 24, borderRadius: '50%',
    background: '#333', color: '#aaa',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0, margin: '14px 0 0 4px'
  },
  fields: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 12px 12px 4px' },
  fieldRow: { display: 'flex', gap: 10 },
  field: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    background: '#2a2a2a', border: '1px solid #3a3a3a',
    borderRadius: 6, color: '#fff', padding: '7px 10px',
    fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box'
  },
  footer: { padding: '14px 20px', borderTop: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', gap: 10 },
  note: { fontSize: 12, color: '#666', margin: 0 },
  footerBtns: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    background: '#2a2a2a', border: '1px solid #444',
    color: '#aaa', borderRadius: 7, padding: '8px 20px',
    cursor: 'pointer', fontSize: 13
  },
  saveBtn: {
    background: '#1565c0', border: 'none',
    color: '#fff', borderRadius: 7, padding: '8px 20px',
    cursor: 'pointer', fontSize: 13, fontWeight: 600
  }
}
