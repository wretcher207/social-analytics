import { useEffect, useState, useMemo } from 'react'
import { listEntries } from '@/lib/journal'
import styles from './EffectsPage.module.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  { label: 'Morning',   hours: [5, 6, 7, 8, 9, 10, 11],          icon: '🌅' },
  { label: 'Afternoon', hours: [12, 13, 14, 15, 16],              icon: '☀️' },
  { label: 'Evening',   hours: [17, 18, 19, 20, 21],              icon: '🌆' },
  { label: 'Night',     hours: [22, 23, 0, 1, 2, 3, 4],          icon: '🌙' },
]

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const BIOMETRICS = [
  { key: 'mood',    label: 'Mood',    beforeKey: 'mood_before',    afterKey: 'mood_after'    },
  { key: 'energy',  label: 'Energy',  beforeKey: 'energy_before',  afterKey: 'energy_after'  },
  { key: 'anxiety', label: 'Anxiety', beforeKey: 'anxiety_before', afterKey: 'anxiety_after' },
  { key: 'pain',    label: 'Pain',    beforeKey: 'pain_before',    afterKey: 'pain_after'    },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function countTags(entries, key) {
  const counts = {}
  for (const e of entries) {
    const tags = Array.isArray(e[key]) ? e[key] : []
    for (const t of tags) {
      counts[t] = (counts[t] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
}

function avgField(entries, key) {
  const vals = entries.map(e => e[key]).filter(v => v != null && !isNaN(v))
  return vals.length ? vals.reduce((s, v) => s + Number(v), 0) / vals.length : null
}

function timeSlotOf(isoStr) {
  const h = new Date(isoStr).getHours()
  for (const slot of TIME_SLOTS) {
    if (slot.hours.includes(h)) return slot.label
  }
  return 'Night'
}

function dowOf(isoStr) {
  return new Date(isoStr).getDay()
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Horizontal bar chart for effect tags */
function TagBars({ data, color }) {
  if (!data.length) return <p className={styles.empty}>No data yet.</p>
  const max = data[0][1]
  return (
    <div className={styles.tagBars}>
      {data.map(([tag, count]) => (
        <div key={tag} className={styles.tagRow}>
          <span className={styles.tagName}>{tag}</span>
          <div className={styles.barWrap}>
            <div
              className={styles.barFill}
              style={{ width: `${(count / max) * 100}%`, background: color }}
            />
          </div>
          <span className={styles.tagCount}>{count}</span>
        </div>
      ))}
    </div>
  )
}

/** Before / after delta for a single biometric */
function DeltaRow({ label, before, after }) {
  if (before == null && after == null) return null
  const delta = (after != null && before != null) ? after - before : null
  const sign  = delta > 0 ? '+' : ''
  const cls   = delta == null ? '' : delta > 0 ? styles.deltaPos : delta < 0 ? styles.deltaNeg : ''

  return (
    <div className={styles.deltaRow}>
      <span className={styles.deltaLabel}>{label}</span>
      <div className={styles.deltaVals}>
        {before != null && <span className={styles.deltaVal}>{before.toFixed(1)}</span>}
        {before != null && after != null && <span className={styles.deltaArrow}>→</span>}
        {after  != null && <span className={styles.deltaVal}>{after.toFixed(1)}</span>}
        {delta != null && (
          <span className={[styles.deltaBadge, cls].join(' ')}>
            {sign}{delta.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}

/** Radial-ish time-of-day distribution */
function TimeSlotChart({ counts, total }) {
  return (
    <div className={styles.timeGrid}>
      {TIME_SLOTS.map(slot => {
        const n   = counts[slot.label] ?? 0
        const pct = total > 0 ? Math.round((n / total) * 100) : 0
        return (
          <div key={slot.label} className={styles.timeCell}>
            <div className={styles.timePieWrap}>
              <svg viewBox="0 0 40 40" className={styles.timePie}>
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-border)" strokeWidth="5" />
                <circle
                  cx="20" cy="20" r="16"
                  fill="none"
                  stroke="var(--color-gold, #c8a96e)"
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 16 * pct / 100} ${2 * Math.PI * 16}`}
                  strokeLinecap="round"
                  transform="rotate(-90 20 20)"
                />
              </svg>
              <span className={styles.timePct}>{pct}%</span>
            </div>
            <span className={styles.timeLabel}>{slot.label}</span>
            <span className={styles.timeCount}>{n} sessions</span>
          </div>
        )
      })}
    </div>
  )
}

/** Day-of-week bar chart */
function DowChart({ counts, max }) {
  return (
    <div className={styles.dowChart}>
      {DOW.map((day, i) => {
        const n = counts[i] ?? 0
        return (
          <div key={day} className={styles.dowCol}>
            <div className={styles.dowBarWrap}>
              <div
                className={styles.dowBar}
                style={{ height: max > 0 ? `${(n / max) * 100}%` : '0%' }}
              />
            </div>
            {n > 0 && <span className={styles.dowCount}>{n}</span>}
            <span className={styles.dowLabel}>{day}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function EffectsPage() {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    listEntries({ limit: 500 })
      .then(r => setEntries(r.data ?? []))
      .catch(() => setEntries([]))
  }, [])

  const data = useMemo(() => {
    if (!entries) return null

    const posEffects = countTags(entries, 'effects')
    const negEffects = countTags(entries, 'negatives')

    const bios = BIOMETRICS.map(b => ({
      ...b,
      before: avgField(entries, b.beforeKey),
      after:  avgField(entries, b.afterKey),
    }))

    const timeSlotCounts = {}
    const dowCounts = {}
    for (const e of entries) {
      if (!e.session_at) continue
      const slot = timeSlotOf(e.session_at)
      timeSlotCounts[slot] = (timeSlotCounts[slot] ?? 0) + 1
      const d = dowOf(e.session_at)
      dowCounts[d] = (dowCounts[d] ?? 0) + 1
    }

    const dowMax = Math.max(...Object.values(dowCounts), 1)

    return { posEffects, negEffects, bios, timeSlotCounts, dowCounts, dowMax, total: entries.length }
  }, [entries])

  if (!entries) {
    return (
      <div className={styles.page}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} style={{ height: 200 }} />
        <div className={styles.skeleton} style={{ height: 140 }} />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Effects & Mood</h1>
        <p className={styles.emptyPage}>No sessions logged yet. Add journal entries to see insights here.</p>
      </div>
    )
  }

  const { posEffects, negEffects, bios, timeSlotCounts, dowCounts, dowMax, total } = data

  const hasBios = bios.some(b => b.before != null || b.after != null)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Effects & Mood</h1>
        <p className={styles.sub}>Insights across {total} session{total !== 1 ? 's' : ''}</p>
      </header>

      {/* ── Effect tags ───────────────────────────────────────────── */}
      <div className={styles.grid2}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Positive effects</h2>
          <TagBars data={posEffects} color="var(--color-gold, #c8a96e)" />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Adverse effects</h2>
          <TagBars data={negEffects} color="#d26060" />
        </section>
      </div>

      {/* ── Before / After biometrics ─────────────────────────────── */}
      {hasBios && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Before → After (avg, 1–10 scale)</h2>
          <div className={styles.deltaGrid}>
            {bios.map(b => (
              <DeltaRow key={b.key} label={b.label} before={b.before} after={b.after} />
            ))}
          </div>
          <p className={styles.cardNote}>
            Positive delta = increase. For anxiety and pain, a negative delta is typically desirable.
          </p>
        </section>
      )}

      {/* ── Time of day ───────────────────────────────────────────── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Time of day</h2>
        <TimeSlotChart counts={timeSlotCounts} total={total} />
      </section>

      {/* ── Day of week ───────────────────────────────────────────── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Day of week</h2>
        <DowChart counts={dowCounts} max={dowMax} />
      </section>
    </div>
  )
}
