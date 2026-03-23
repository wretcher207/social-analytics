import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { TERPENES } from '@/lib/constants'
import styles from './TerpeneEditor.module.css'

/**
 * Editable list of terpene entries [{name, pct}].
 * value / onChange follow controlled component pattern.
 */
export function TerpeneEditor({ value = [], onChange }) {
  const [customName, setCustomName] = useState('')
  const [selectedName, setSelectedName] = useState(TERPENES[0].name)
  const [pct, setPct] = useState('')

  function add() {
    const name = customName.trim() || selectedName
    if (!name) return
    const parsed = parseFloat(pct)
    const entry = { name, pct: isNaN(parsed) ? null : parsed }
    onChange([...value, entry])
    setPct('')
    setCustomName('')
  }

  function remove(idx) {
    onChange(value.filter((_, i) => i !== idx))
  }

  function updatePct(idx, raw) {
    const parsed = parseFloat(raw)
    const updated = value.map((t, i) =>
      i === idx ? { ...t, pct: isNaN(parsed) ? null : parsed } : t
    )
    onChange(updated)
  }

  return (
    <div className={styles.root}>
      {/* Existing entries */}
      {value.length > 0 && (
        <div className={styles.list}>
          {value.map((t, i) => (
            <div key={i} className={styles.row}>
              <span className={styles.name}>{t.name}</span>
              <input
                type="number"
                className={styles.pctInput}
                value={t.pct ?? ''}
                onChange={e => updatePct(i, e.target.value)}
                placeholder="—"
                min="0"
                max="100"
                step="0.01"
              />
              <span className={styles.unit}>%</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => remove(i)}
                aria-label={`Remove ${t.name}`}
              >
                <Trash2 size={11} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add row */}
      <div className={styles.addRow}>
        <select
          className={styles.nameSelect}
          value={selectedName}
          onChange={e => { setSelectedName(e.target.value); setCustomName('') }}
        >
          {TERPENES.map(t => (
            <option key={t.name} value={t.name}>{t.name}</option>
          ))}
          <option value="">Custom…</option>
        </select>

        {selectedName === '' && (
          <input
            type="text"
            className={styles.customInput}
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="Terpene name"
          />
        )}

        <input
          type="number"
          className={styles.pctInput}
          value={pct}
          onChange={e => setPct(e.target.value)}
          placeholder="pct"
          min="0"
          max="100"
          step="0.01"
        />
        <span className={styles.unit}>%</span>

        <button
          type="button"
          className={styles.addBtn}
          onClick={add}
          aria-label="Add terpene"
        >
          <Plus size={12} strokeWidth={2} />
        </button>
      </div>

      {/* Hint: known terpene note */}
      {value.length > 0 && (() => {
        const known = TERPENES.find(t => t.name === value[value.length - 1]?.name)
        return known ? (
          <p className={styles.hint}>{known.note}</p>
        ) : null
      })()}
    </div>
  )
}
