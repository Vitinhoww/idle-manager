import React, { useState } from 'react'

export default function ExecutionsModal({ executions, activeExecutionId, onSwitch, onCreate, onRename, onDelete, onClose }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const startEdit = (exec) => {
    setEditingId(exec.id)
    setEditingName(exec.name)
  }

  const confirmEdit = async () => {
    if (editingName.trim()) await onRename(editingId, editingName.trim())
    setEditingId(null)
  }

  const handleCreate = async () => {
    const name = newName.trim() || `Execucao ${executions.length + 1}`
    await onCreate(name)
    setNewName('')
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <span style={S.title}>Execucoes</span>
          <button style={S.closeBtn} onClick={onClose}>x</button>
        </div>

        <div style={S.body}>
          <p style={S.hint}>
            Cada execucao tem cache e login separados. Trocar de execucao nao apaga o progresso das outras.
          </p>
          {executions.map(exec => {
            const isActive = exec.id === activeExecutionId
            return (
              <div key={exec.id} style={{ ...S.row, ...(isActive ? S.activeRow : {}) }}>
                <span style={{ ...S.dot, background: isActive ? '#4caf50' : '#444' }} />

                {editingId === exec.id ? (
                  <input
                    style={S.editInput}
                    value={editingName}
                    autoFocus
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={confirmEdit}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit() }}
                  />
                ) : (
                  <span
                    style={{ ...S.execName, cursor: isActive ? 'default' : 'pointer', color: isActive ? '#fff' : '#aaa' }}
                    onClick={() => !isActive && onSwitch(exec.id)}
                  >
                    {exec.name}
                    {isActive && <span style={S.activePill}>activa</span>}
                  </span>
                )}

                <button style={S.iconBtn} onClick={() => startEdit(exec)} title="Renomear">edit</button>
                <button
                  style={{ ...S.iconBtn, color: executions.length <= 1 ? '#444' : '#e57373' }}
                  disabled={executions.length <= 1}
                  onClick={() => executions.length > 1 && onDelete(exec.id)}
                  title={executions.length <= 1 ? 'Nao podes apagar a ultima execucao' : 'Apagar'}
                >del</button>
              </div>
            )
          })}
        </div>

        <div style={S.footer}>
          <input
            style={S.newInput}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome da nova execucao..."
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          />
          <button style={S.createBtn} onClick={handleCreate}>+ Criar</button>
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
    borderRadius: 12, width: 480,
    maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  header: {
    padding: '16px 20px', borderBottom: '1px solid #2a2a2a',
    display: 'flex', alignItems: 'center'
  },
  title: { flex: 1, fontWeight: 700, fontSize: 16, color: '#fff' },
  closeBtn: {
    background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: 16
  },
  body: {
    overflowY: 'auto', padding: '12px 20px',
    display: 'flex', flexDirection: 'column', gap: 8
  },
  hint: {
    fontSize: 12, color: '#666', margin: '0 0 4px'
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#222', borderRadius: 8,
    padding: '10px 14px', border: '1px solid #2a2a2a'
  },
  activeRow: {
    border: '1px solid #3a5a3a', background: '#1b2b1b'
  },
  dot: {
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0
  },
  execName: {
    flex: 1, fontSize: 14, fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: 8
  },
  activePill: {
    fontSize: 10, fontWeight: 700, color: '#4caf50',
    background: '#1b3a1b', padding: '1px 6px', borderRadius: 4,
    textTransform: 'uppercase', letterSpacing: 0.5
  },
  editInput: {
    flex: 1, background: '#2a2a2a', border: '1px solid #555',
    borderRadius: 5, color: '#fff', padding: '4px 8px',
    fontSize: 13, outline: 'none'
  },
  iconBtn: {
    background: '#2a2a2a', border: '1px solid #333',
    borderRadius: 5, color: '#aaa', cursor: 'pointer',
    padding: '3px 8px', fontSize: 11
  },
  footer: {
    padding: '14px 20px', borderTop: '1px solid #2a2a2a',
    display: 'flex', gap: 10
  },
  newInput: {
    flex: 1, background: '#2a2a2a', border: '1px solid #3a3a3a',
    borderRadius: 6, color: '#fff', padding: '7px 10px',
    fontSize: 13, outline: 'none'
  },
  createBtn: {
    background: '#1565c0', border: 'none',
    color: '#fff', borderRadius: 7, padding: '8px 16px',
    cursor: 'pointer', fontSize: 13, fontWeight: 600
  }
}
