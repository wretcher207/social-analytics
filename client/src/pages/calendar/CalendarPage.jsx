import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, Star } from 'lucide-react'
import { listEntries } from '@/lib/journal'
import { listLogs } from '@/lib/consumption'
import styles from './CalendarPage.module.css'

// ── Date helpers ──────────────────────────────────────────────────────────────

function ymd(date) {
  return date.toISOString().slice(0, 10)
}

function monthBounds(year, month) {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  return { first, last }
}

function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })
}

function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function formatTime(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// ── Activity intensity (0–4) ──────────────────────────────────────────────────

function intensity(count) {
  if (!count) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4)  return 3
  return 4
}

// ── Star rating display ───────────────────────────────────────────────────────

function Stars({ rating }) {
  if (rating == null) return null
  return (
    <span className={styles.stars} aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={9}
          strokeWidth={1.5}
          fill={i < rating ? 'currentColor' : 'none'}
          className={i < rating ? styles.starFilled : styles.starEmpty}
        />
      ))}
    </span>
  )
}

// ── Day cell ──────────────────────────────────────────────────────────────────

function DayCell({ dateStr, today, count, avgRating, selected, onSelect, isCurrentMonth }) {
  const level = intensity(count)
  return (
    <button
      type="button"
      className={[
        styles.cell,
        today    ? styles.cellToday    : '',
        selected ? styles.cellSelected : '',
        !isCurrentMonth ? styles.cellFaded : '',
        level > 0 ? styles[`level${level}`] : '',
      ].join(' ')}
      onClick={() => onSelect(dateStr)}
      aria-label={`${dateStr}${count ? `, ${count} session${count !== 1 ? 's' : ''}` : ''}`}
    >
      <span className={styles.cellDay}>
        {parseInt(dateStr.slice(8), 10)}
      </span>
      {count > 0 && (
        <span className={styles.cellCount}>{count}</span>
      )}
      {avgRating != null && (
        <span className={styles.cellRating}>{avgRating.toFixed(1)}</span>
      )}
    </button>
  )
}

// ── Day panel ─────────────────────────────────────────────────────────────────

function DayPanel({ dateStr, entries, logs, onClose }) {
  const navigate = useNavigate()
  const entryItems = entries.filter(e => e.session_at?.slice(0, 10) === dateStr)
  const logItems   = logs.filter(l => l.started_at?.slice(0, 10) === dateStr)
  const total = entryItems.length + logItems.length

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelDate}>{formatDayHeader(dateStr)}</span>
        <button type="button" className={styles.panelClose} onClick={onClose} aria-label="Close">
          <X size={13} strokeWidth={1.5} />
        </button>
      </div>

      <div className={styles.panelBody}>
        {total === 0 && (
          <p className={styles.panelEmpty}>No activity recorded.</p>
        )}

        {entryItems.length > 0 && (
          <section className={styles.panelSection}>
            <h3 className={styles.panelSectionTitle}>Journal entries</h3>
            {entryItems.map(e => (
              <button
                key={e.id}
                type="button"
                className={styles.panelItem}
                onClick={() => navigate(`/journal/${e.id}`)}
              >
                <div className={styles.panelItemTop}>
                  <span className={styles.panelItemName}>
                    {e.products?.name ?? e.strains?.name ?? 'Session'}
                  </span>
                  <span className={styles.panelItemTime}>{formatTime(e.session_at)}</span>
                </div>
                <div className={styles.panelItemMeta}>
                  {e.consumption_method && (
                    <span className={styles.panelMethod}>{e.consumption_method}</span>
                  )}
                  <Stars rating={e.overall_rating} />
                </div>
              </button>
            ))}
          </section>
        )}

        {logItems.length > 0 && (
          <section className={styles.panelSection}>
            <h3 className={styles.panelSectionTitle}>Quick logs</h3>
            {logItems.map(l => (
              <button
                key={l.id}
                type="button"
                className={styles.panelItem}
                onClick={() => navigate('/log')}
              >
                <div className={styles.panelItemTop}>
                  <span className={styles.panelItemName}>
                    {l.products?.name ?? 'Log entry'}
                  </span>
                  <span className={styles.panelItemTime}>{formatTime(l.started_at)}</span>
                </div>
                {l.method && (
                  <div className={styles.panelItemMeta}>
                    <span className={styles.panelMethod}>{l.method}</span>
                  </div>
                )}
              </button>
            ))}
          </section>
        )}
      </div>
    </aside>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarPage() {
  const now = new Date()
  const [year,     setYear]     = useState(now.getFullYear())
  const [month,    setMonth]    = useState(now.getMonth())
  const [entries,  setEntries]  = useState([])
  const [logs,     setLogs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  const today = ymd(now)

  // Re-fetch when month/year changes
  useEffect(() => {
    setLoading(true)
    const { first, last } = monthBounds(year, month)
    // Expand range slightly to cover leading/trailing cells
    const from = ymd(new Date(first.getTime() - 7 * 86400000))
    const to   = ymd(new Date(last.getTime()  + 7 * 86400000))

    Promise.all([
      listEntries({ from, to, limit: 300 }),
      listLogs({ from, to, limit: 300 }),
    ]).then(([eRes, lRes]) => {
      setEntries(eRes.data ?? [])
      setLogs(lRes.data ?? [])
    }).finally(() => setLoading(false))
  }, [year, month])

  // Build day data map
  const dayMap = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      const d = e.session_at?.slice(0, 10)
      if (!d) return
      if (!map[d]) map[d] = { count: 0, ratings: [] }
      map[d].count++
      if (e.overall_rating != null) map[d].ratings.push(e.overall_rating)
    })
    logs.forEach(l => {
      const d = l.started_at?.slice(0, 10)
      if (!d) return
      if (!map[d]) map[d] = { count: 0, ratings: [] }
      map[d].count++
    })
    // Compute average rating per day
    Object.values(map).forEach(v => {
      v.avgRating = v.ratings.length
        ? v.ratings.reduce((a, b) => a + b, 0) / v.ratings.length
        : null
    })
    return map
  }, [entries, logs])

  // Build grid cells
  const cells = useMemo(() => {
    const { first, last } = monthBounds(year, month)
    // Leading empty days (0=Sun)
    const startDow = first.getDay()
    const result = []
    // Leading days from previous month
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(first.getTime() - (i + 1) * 86400000)
      result.push({ dateStr: ymd(d), isCurrentMonth: false })
    }
    // Days of current month
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      result.push({ dateStr: ymd(new Date(d)), isCurrentMonth: true })
    }
    // Trailing days to fill last row
    const trailing = 7 - (result.length % 7)
    if (trailing < 7) {
      for (let i = 1; i <= trailing; i++) {
        const d = new Date(last.getTime() + i * 86400000)
        result.push({ dateStr: ymd(d), isCurrentMonth: false })
      }
    }
    return result
  }, [year, month])

  // Month navigation
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  // Total sessions in this month
  const monthTotal = useMemo(() => {
    const { first, last } = monthBounds(year, month)
    const f = ymd(first), l = ymd(last)
    return Object.entries(dayMap)
      .filter(([d]) => d >= f && d <= l)
      .reduce((s, [, v]) => s + v.count, 0)
  }, [dayMap, year, month])

  const activeDays = useMemo(() => {
    const { first, last } = monthBounds(year, month)
    const f = ymd(first), l = ymd(last)
    return Object.entries(dayMap).filter(([d, v]) => d >= f && d <= l && v.count > 0).length
  }, [dayMap, year, month])

  return (
    <div className={[styles.page, selected ? styles.panelOpen : ''].join(' ')}>
      <div className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.navRow}>
            <button type="button" className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <h1 className={styles.monthTitle}>{formatMonthYear(year, month)}</h1>
            <button type="button" className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
          <p className={styles.monthSummary}>
            {loading
              ? 'Loading…'
              : <><span className="mono">{monthTotal}</span> sessions · <span className="mono">{activeDays}</span> active days</>
            }
          </p>
        </header>

        {/* Calendar grid */}
        <div className={styles.grid}>
          {/* Weekday headers */}
          {WEEKDAYS.map(d => (
            <span key={d} className={styles.weekday}>{d}</span>
          ))}

          {/* Day cells */}
          {cells.map(({ dateStr, isCurrentMonth }) => {
            const data = dayMap[dateStr]
            return (
              <DayCell
                key={dateStr}
                dateStr={dateStr}
                today={dateStr === today}
                count={data?.count ?? 0}
                avgRating={data?.avgRating ?? null}
                selected={selected === dateStr}
                onSelect={d => setSelected(s => s === d ? null : d)}
                isCurrentMonth={isCurrentMonth}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <span className={styles.legendLabel}>Less</span>
          {[0, 1, 2, 3, 4].map(l => (
            <span key={l} className={[styles.legendDot, l > 0 ? styles[`level${l}`] : styles.levelNone].join(' ')} />
          ))}
          <span className={styles.legendLabel}>More</span>
        </div>
      </div>

      {/* Side panel */}
      {selected && (
        <DayPanel
          dateStr={selected}
          entries={entries}
          logs={logs}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
