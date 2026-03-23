import { useState, useEffect, useCallback } from 'react'
import { PlusCircle, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import styles from './ToleranceBreakPage.module.css'

// ── localStorage helpers ───────────────────────────────────────────────────

const LS_KEY = 'tolerance_breaks'

function loadBreaks() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? [] }
  catch { return [] }
}

function saveBreaks(breaks) {
  localStorage.setItem(LS_KEY, JSON.stringify(breaks))
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Date helpers ───────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().slice(0, 10)
}

/** Days between two YYYY-MM-DD strings (inclusive start, exclusive end) */
function daysBetween(start, end) {
  return Math.round(
    (new Date(end) - new Date(start)) / 86_400_000
  )
}

function daysFromToday(dateStr) {
  return daysBetween(today(), dateStr)
}

/** Human-readable countdown */
function fmtCountdown(endDate) {
  const ms = new Date(endDate) - Date.now()
  if (ms <= 0) return null
  const totalH = Math.floor(ms / 3_600_000)
  const d = Math.floor(totalH / 24)
  const h = totalH % 24
  if (d > 0) return `${d}d ${h}h remaining`
  return `${h}h remaining`
}

function fmtDate(str) {
  return new Date(str + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ── Break status ───────────────────────────────────────────────────────────

function breakStatus(b) {
  const t = today()
  if (b.start > t) return 'upcoming'
  if (b.end >= t)  return 'active'
  return 'completed'
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    active:    [styles.badgeActive,    'ACTIVE'],
    upcoming:  [styles.badgeUpcoming,  'UPCOMING'],
    completed: [styles.badgeCompleted, 'COMPLETE'],
  }
  const [cls, label] = map[status] ?? [styles.badgeCompleted, status.toUpperCase()]
  return <span className={[styles.badge, cls].join(' ')}>{label}</span>
}

// ── Countdown ring (pure CSS) ──────────────────────────────────────────────

function ProgressRing({ pct }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const dash = circ * (1 - Math.min(Math.max(pct, 0), 1))
  return (
    <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
      <circle className={styles.ringTrack} cx="50" cy="50" r={r} />
      <circle
        className={styles.ringFill}
        cx="50"
        cy="50"
        r={r}
        strokeDasharray={circ}
        strokeDashoffset={dash}
        transform="rotate(-90 50 50)"
      />
    </svg>
  )
}

// ── "Plan a break" form ────────────────────────────────────────────────────

function PlanForm({ onSave, onCancel }) {
  const [start,    setStart]    = useState(today())
  const [durDays,  setDurDays]  = useState(7)
  const [reason,   setReason]   = useState('')
  const [useDate,  setUseDate]  = useState(false)
  const [endDate,  setEndDate]  = useState('')

  const computedEnd = useDate
    ? endDate
    : (() => {
        const d = new Date(start + 'T00:00:00')
        d.setDate(d.getDate() + Number(durDays))
        return d.toISOString().slice(0, 10)
      })()

  function handleSubmit(e) {
    e.preventDefault()
    if (!computedEnd || computedEnd <= start) return
    onSave({
      id: uid(),
      start,
      end: computedEnd,
      reason: reason || null,
    })
  }

  const duration = daysBetween(start, computedEnd)

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.formTitle}>Plan a break</h3>

      <div className={styles.formRow}>
        <label className={styles.label}>Start date</label>
        <input
          type="date"
          className={styles.input}
          value={start}
          min={today()}
          onChange={e => setStart(e.target.value)}
          required
        />
      </div>

      <div className={styles.formRow}>
        <label className={styles.label}>Duration</label>
        <div className={styles.durRow}>
          {useDate ? (
            <input
              type="date"
              className={styles.input}
              value={endDate}
              min={start}
              onChange={e => setEndDate(e.target.value)}
              required
            />
          ) : (
            <div className={styles.durSlider}>
              <input
                type="range"
                min={1}
                max={90}
                value={durDays}
                onChange={e => setDurDays(e.target.value)}
                className={styles.slider}
              />
              <span className={styles.durVal}>{durDays} days</span>
            </div>
          )}
          <button
            type="button"
            className={styles.toggleMode}
            onClick={() => setUseDate(v => !v)}
          >
            {useDate ? 'Use slider' : 'Pick end date'}
          </button>
        </div>
      </div>

      {computedEnd && computedEnd > start && (
        <p className={styles.summary}>
          {fmtDate(start)} → {fmtDate(computedEnd)}
          <span className={styles.summaryDur}> ({duration} day{duration !== 1 ? 's' : ''})</span>
        </p>
      )}

      <div className={styles.formRow}>
        <label className={styles.label}>Reason <span className={styles.opt}>(optional)</span></label>
        <input
          type="text"
          className={styles.input}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Reducing tolerance, detox week…"
        />
      </div>

      <div className={styles.formActions}>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={!computedEnd || computedEnd <= start}>
          Schedule break
        </Button>
      </div>
    </form>
  )
}

// ── Hero card (active / upcoming break) ───────────────────────────────────

function HeroCard({ b, onDelete }) {
  const status = breakStatus(b)
  const totalDays = daysBetween(b.start, b.end)
  const elapsed   = Math.max(0, daysBetween(b.start, today()))
  const pct       = status === 'completed' ? 1 : totalDays > 0 ? elapsed / totalDays : 0
  const countdown = status === 'active' ? fmtCountdown(b.end) : null

  return (
    <div className={[styles.hero, status === 'active' ? styles.heroActive : ''].join(' ')}>
      <div className={styles.heroLeft}>
        <StatusBadge status={status} />
        <div className={styles.heroStats}>
          {status === 'active' && (
            <>
              <span className={styles.heroBig}>{elapsed}</span>
              <span className={styles.heroUnit}>day{elapsed !== 1 ? 's' : ''} in</span>
              <span className={styles.heroSmall}>of {totalDays}</span>
            </>
          )}
          {status === 'upcoming' && (
            <>
              <span className={styles.heroBig}>{daysFromToday(b.start)}</span>
              <span className={styles.heroUnit}>day{daysFromToday(b.start) !== 1 ? 's' : ''} away</span>
            </>
          )}
          {status === 'completed' && (
            <>
              <CheckCircle2 size={28} strokeWidth={1.5} className={styles.heroCheck} />
              <span className={styles.heroUnit}>{totalDays}-day break complete</span>
            </>
          )}
        </div>
        {countdown && <p className={styles.heroCountdown}>{countdown}</p>}
        <div className={styles.heroDates}>
          {fmtDate(b.start)} – {fmtDate(b.end)}
        </div>
        {b.reason && <p className={styles.heroReason}>{b.reason}</p>}
      </div>

      <div className={styles.heroRight}>
        <div className={styles.ringWrap}>
          <ProgressRing pct={pct} />
          <span className={styles.ringPct}>{Math.round(pct * 100)}%</span>
        </div>
        <button
          className={styles.deleteBtn}
          type="button"
          onClick={() => onDelete(b.id)}
          aria-label="Delete break"
        >
          <Trash2 size={13} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

// ── History row ────────────────────────────────────────────────────────────

function HistoryRow({ b, onDelete }) {
  const totalDays = daysBetween(b.start, b.end)
  return (
    <li className={styles.histRow}>
      <div className={styles.histLeft}>
        <span className={styles.histDates}>{fmtDate(b.start)} – {fmtDate(b.end)}</span>
        <span className={styles.histDur}>{totalDays}d</span>
        {b.reason && <span className={styles.histReason}>{b.reason}</span>}
      </div>
      <StatusBadge status={breakStatus(b)} />
      <button
        className={styles.deleteBtn}
        type="button"
        onClick={() => onDelete(b.id)}
        aria-label="Delete"
      >
        <Trash2 size={12} strokeWidth={1.5} />
      </button>
    </li>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export function ToleranceBreakPage() {
  const [breaks,   setBreaks]   = useState(loadBreaks)
  const [showForm, setShowForm] = useState(false)

  // Refresh countdown every minute while page is open
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const persist = useCallback(b => { setBreaks(b); saveBreaks(b) }, [])

  function addBreak(b) { persist([b, ...breaks]); setShowForm(false) }
  function delBreak(id) { persist(breaks.filter(b => b.id !== id)) }

  // Sort: active first, then upcoming, then completed (newest first)
  const sorted = [...breaks].sort((a, b) => {
    const order = { active: 0, upcoming: 1, completed: 2 }
    const sa = order[breakStatus(a)], sb = order[breakStatus(b)]
    if (sa !== sb) return sa - sb
    return new Date(b.start) - new Date(a.start)
  })

  const hero     = sorted[0] ?? null
  const history  = sorted.slice(1)
  const hasBreak = breaks.length > 0

  // Stats
  const completedBreaks = breaks.filter(b => breakStatus(b) === 'completed')
  const totalDaysOff    = completedBreaks.reduce((s, b) => s + daysBetween(b.start, b.end), 0)
  const longest         = completedBreaks.reduce((m, b) => Math.max(m, daysBetween(b.start, b.end)), 0)

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>Tolerance Break</h1>
          <p className={styles.sub}>Schedule and track your breaks</p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <PlusCircle size={13} strokeWidth={1.5} /> Plan a break
          </Button>
        )}
      </div>

      {/* Summary stats */}
      {completedBreaks.length > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.statCell}>
            <span className={styles.statVal}>{completedBreaks.length}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statVal}>{totalDaysOff}</span>
            <span className={styles.statLabel}>Total days off</span>
          </div>
          <div className={styles.statCell}>
            <span className={styles.statVal}>{longest}</span>
            <span className={styles.statLabel}>Longest streak</span>
          </div>
        </div>
      )}

      {/* Plan form */}
      {showForm && (
        <PlanForm onSave={addBreak} onCancel={() => setShowForm(false)} />
      )}

      {/* No breaks state */}
      {!hasBreak && !showForm && (
        <div className={styles.empty}>
          <p>No breaks scheduled yet.</p>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            <PlusCircle size={13} strokeWidth={1.5} /> Schedule your first break
          </Button>
        </div>
      )}

      {/* Hero card */}
      {hero && <HeroCard b={hero} onDelete={delBreak} />}

      {/* History */}
      {history.length > 0 && (
        <section className={styles.histSection}>
          <h2 className={styles.histTitle}>History</h2>
          <ul className={styles.histList}>
            {history.map(b => <HistoryRow key={b.id} b={b} onDelete={delBreak} />)}
          </ul>
        </section>
      )}
    </div>
  )
}
