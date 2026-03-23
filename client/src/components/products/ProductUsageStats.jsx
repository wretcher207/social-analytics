import { useEffect, useState } from 'react'
import { listEntries } from '@/lib/journal'
import styles from './ProductUsageStats.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the Monday of the week containing `date` */
function weekStart(date) {
  const d = new Date(date)
  const day = d.getDay()               // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function shortWeekLabel(monday) {
  return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Build an array of { label, count } for the last `weeks` calendar weeks */
function buildWeekBuckets(entries, weeks = 10) {
  const now = new Date()
  const buckets = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = weekStart(now)
    start.setDate(start.getDate() - i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    buckets.push({ label: shortWeekLabel(start), start, end, count: 0 })
  }

  for (const entry of entries) {
    const d = new Date(entry.session_at)
    for (const b of buckets) {
      if (d >= b.start && d < b.end) { b.count++; break }
    }
  }
  return buckets
}

/** Average of defined numeric values in array */
function avg(arr) {
  const vals = arr.filter(v => v != null)
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProductUsageStats({ productId }) {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    setEntries(null)
    listEntries({ product_id: productId, limit: 200 })
      .then(r => setEntries(r.data ?? []))
      .catch(() => setEntries([]))
  }, [productId])

  if (entries === null) {
    return <div className={styles.skeleton} />
  }

  if (entries.length === 0) {
    return (
      <p className={styles.empty}>No sessions recorded with this product yet.</p>
    )
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const sorted = [...entries].sort((a, b) => new Date(b.session_at) - new Date(a.session_at))
  const lastDate = new Date(sorted[0].session_at)
  const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86_400_000)

  const ratings = entries.map(e => e.overall_rating).filter(r => r != null)
  const avgRating = avg(ratings)

  const weeks = buildWeekBuckets(entries, 10)
  const maxCount = Math.max(...weeks.map(w => w.count), 1)

  // Top 3 methods
  const methodCounts = {}
  for (const e of entries) {
    if (e.consumption_method) methodCounts[e.consumption_method] = (methodCounts[e.consumption_method] ?? 0) + 1
  }
  const topMethods = Object.entries(methodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => m)

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      {/* Summary row */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCell}>
          <span className={styles.summaryVal}>{entries.length}</span>
          <span className={styles.summaryLabel}>Sessions</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.summaryCell}>
          <span className={styles.summaryVal}>
            {daysSince === 0 ? 'Today' : `${daysSince}d`}
          </span>
          <span className={styles.summaryLabel}>Since last use</span>
        </div>

        {avgRating != null && (
          <>
            <div className={styles.divider} />
            <div className={styles.summaryCell}>
              <span className={styles.summaryVal}>
                {avgRating.toFixed(1)}
                <span className={styles.summaryUnit}>/5</span>
              </span>
              <span className={styles.summaryLabel}>Avg rating</span>
            </div>
          </>
        )}

        {topMethods.length > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.summaryCell}>
              <span className={styles.summaryVal} style={{ fontSize: '0.875rem' }}>
                {topMethods.join(', ')}
              </span>
              <span className={styles.summaryLabel}>Common method{topMethods.length > 1 ? 's' : ''}</span>
            </div>
          </>
        )}
      </div>

      {/* Weekly bar chart */}
      <div className={styles.chartWrap}>
        <p className={styles.chartTitle}>Sessions per week</p>
        <div className={styles.chart}>
          {weeks.map(w => (
            <div key={w.label} className={styles.bar}>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ height: `${(w.count / maxCount) * 100}%` }}
                  title={`${w.count} session${w.count !== 1 ? 's' : ''}`}
                />
              </div>
              {w.count > 0 && (
                <span className={styles.barCount}>{w.count}</span>
              )}
              <span className={styles.barLabel}>{w.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
