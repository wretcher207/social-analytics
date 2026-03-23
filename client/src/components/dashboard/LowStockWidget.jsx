import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, X, ChevronRight } from 'lucide-react'
import { listProducts } from '@/lib/products'
import styles from './LowStockWidget.module.css'

const LS_KEY   = 'lowstock_threshold_g'
const LS_HIDE  = 'lowstock_dismissed_at'

const DEFAULT_THRESHOLD = 2 // grams

function getThreshold() {
  const v = parseFloat(localStorage.getItem(LS_KEY))
  return isNaN(v) ? DEFAULT_THRESHOLD : v
}

function wasDismissedToday() {
  const ts = localStorage.getItem(LS_HIDE)
  if (!ts) return false
  const d = new Date(ts)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  )
}

export function LowStockWidget() {
  const navigate = useNavigate()
  const [lowItems,   setLowItems]   = useState(null)   // null = loading
  const [dismissed,  setDismissed]  = useState(wasDismissedToday)
  const [threshold,  setThreshold]  = useState(getThreshold)
  const [editingThr, setEditingThr] = useState(false)
  const [tInput,     setTInput]     = useState(String(getThreshold()))

  useEffect(() => {
    listProducts({ limit: 200 })
      .then(r => {
        const all = r.data ?? []
        const low = all.filter(
          p => !p.archived && p.remaining_g != null && p.remaining_g <= threshold
        )
        setLowItems(low)
      })
      .catch(() => setLowItems([]))
  }, [threshold])

  // Nothing to show
  if (dismissed || lowItems === null || lowItems.length === 0) return null

  function dismiss() {
    localStorage.setItem(LS_HIDE, new Date().toISOString())
    setDismissed(true)
  }

  function saveThreshold() {
    const v = parseFloat(tInput)
    if (!isNaN(v) && v > 0) {
      localStorage.setItem(LS_KEY, String(v))
      setThreshold(v)
    }
    setEditingThr(false)
  }

  return (
    <div className={styles.widget} role="alert">
      <div className={styles.header}>
        <span className={styles.iconWrap}>
          <AlertTriangle size={13} strokeWidth={2} />
        </span>
        <span className={styles.title}>
          {lowItems.length} product{lowItems.length > 1 ? 's' : ''} running low
        </span>

        {/* Threshold control */}
        {editingThr ? (
          <div className={styles.thrEdit}>
            <span className={styles.thrLabel}>Threshold:</span>
            <input
              className={styles.thrInput}
              type="number"
              min="0.1"
              step="0.5"
              value={tInput}
              onChange={e => setTInput(e.target.value)}
              onBlur={saveThreshold}
              onKeyDown={e => e.key === 'Enter' && saveThreshold()}
              autoFocus
            />
            <span className={styles.thrLabel}>g</span>
          </div>
        ) : (
          <button
            className={styles.thrBtn}
            type="button"
            onClick={() => { setTInput(String(threshold)); setEditingThr(true) }}
          >
            ≤ {threshold}g
          </button>
        )}

        <button className={styles.dismiss} type="button" onClick={dismiss} aria-label="Dismiss">
          <X size={12} strokeWidth={2} />
        </button>
      </div>

      <ul className={styles.list}>
        {lowItems.map(p => (
          <li key={p.id}>
            <button
              className={styles.item}
              type="button"
              onClick={() => navigate(`/products/${p.id}`)}
            >
              <div className={styles.itemLeft}>
                <span className={styles.itemName}>{p.name}</span>
                {p.brand && <span className={styles.itemBrand}>{p.brand}</span>}
              </div>
              <div className={styles.itemRight}>
                <span
                  className={[
                    styles.pill,
                    p.remaining_g === 0 ? styles.pillEmpty : styles.pillLow,
                  ].join(' ')}
                >
                  {p.remaining_g === 0 ? 'Empty' : `${p.remaining_g}g left`}
                </span>
                <ChevronRight size={11} strokeWidth={1.5} className={styles.chevron} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
