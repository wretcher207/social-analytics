import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Star, ChevronDown } from 'lucide-react'
import { listEntries } from '@/lib/journal'
import { listLogs, METHODS, METHOD_COLOR } from '@/lib/consumption'
import styles from './TimelinePage.module.css'

// ── Date helpers ──────────────────────────────────────────────────────────────

function dayKey(isoStr) {
  return isoStr?.slice(0, 10) ?? ''
}

function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today     = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today)     return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// ── Star rating ───────────────────────────────────────────────────────────────

function Stars({ rating }) {
  return (
    <span className={styles.stars} aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={10}
          strokeWidth={1.5}
          fill={i < rating ? 'currentColor' : 'none'}
          className={i < rating ? styles.starOn : styles.starOff}
        />
      ))}
    </span>
  )
}

// ── Timeline item ─────────────────────────────────────────────────────────────

function TimelineItem({ item }) {
  const navigate = useNavigate()
  const isJournal = item._type === 'journal'
  const method = isJournal ? item.consumption_method : item.method
  const methodColor = METHOD_COLOR[method] ?? METHOD_COLOR.other

  function handleClick() {
    if (isJournal) navigate(`/journal/${item.id}`)
    else navigate('/log')
  }

  return (
    <button type="button" className={styles.item} onClick={handleClick}>
      {/* Type badge + time */}
      <div className={styles.itemHead}>
        <span
          className={[styles.typeBadge, isJournal ? styles.badgeJournal : styles.badgeLog].join(' ')}
        >
          {isJournal ? 'Journal' : 'Quick log'}
        </span>
        <span className={styles.itemTime}>{formatTime(item._date)}</span>
      </div>

      {/* Name */}
      <p className={styles.itemName}>
        {item.products?.name ?? item.strains?.name ?? (isJournal ? 'Unnamed session' : 'Log entry')}
      </p>

      {/* Meta row */}
      <div className={styles.itemMeta}>
        {method && (
          <span
            className={styles.methodPill}
            style={{ color: methodColor, borderColor: `${methodColor}44` }}
          >
            {method}
          </span>
        )}
        {isJournal && item.overall_rating != null && (
          <Stars rating={item.overall_rating} />
        )}
        {item.products?.thc_pct != null && (
          <span className={styles.thcTag}>THC {item.products.thc_pct}%</span>
        )}
        {isJournal && item.strains?.name && item.products == null && (
          <span className={styles.strainTag}>{item.strains.name}</span>
        )}
      </div>

      {/* Note preview */}
      {isJournal && item.notes && (
        <p className={styles.notesPreview}>{item.notes}</p>
      )}
    </button>
  )
}

// ── Day group ─────────────────────────────────────────────────────────────────

function DayGroup({ dateStr, items }) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <section className={styles.dayGroup}>
      <h3 className={[styles.dayLabel, dateStr === today ? styles.dayLabelToday : ''].join(' ')}>
        {formatDayHeader(dateStr)}
        <span className={styles.dayCount}>{items.length}</span>
      </h3>
      <div className={styles.dayItems}>
        {items.map(item => (
          <TimelineItem key={`${item._type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 40  // items shown at a time

export function TimelinePage() {
  const navigate = useNavigate()
  const [entries,       setEntries]       = useState([])
  const [logs,          setLogs]          = useState([])
  const [loading,       setLoading]       = useState(true)
  const [methodFilter,  setMethodFilter]  = useState('all')
  const [typeFilter,    setTypeFilter]    = useState('all')
  const [visibleCount,  setVisibleCount]  = useState(PAGE_SIZE)

  useEffect(() => {
    Promise.all([
      listEntries({ limit: 500 }),
      listLogs({ limit: 500 }),
    ]).then(([eRes, lRes]) => {
      setEntries((eRes.data ?? []).map(e => ({
        ...e, _type: 'journal', _date: e.session_at,
      })))
      setLogs((lRes.data ?? []).map(l => ({
        ...l, _type: 'log', _date: l.started_at,
      })))
    }).finally(() => setLoading(false))
  }, [])

  // All items merged + sorted newest first
  const allItems = useMemo(() => {
    return [...entries, ...logs].sort((a, b) =>
      (b._date ?? '').localeCompare(a._date ?? '')
    )
  }, [entries, logs])

  // Filtered
  const filtered = useMemo(() => {
    return allItems.filter(item => {
      if (typeFilter !== 'all' && item._type !== typeFilter) return false
      const method = item._type === 'journal' ? item.consumption_method : item.method
      if (methodFilter !== 'all' && method !== methodFilter) return false
      return true
    })
  }, [allItems, methodFilter, typeFilter])

  // Group by day (only the visible slice)
  const visibleItems = filtered.slice(0, visibleCount)

  const grouped = useMemo(() => {
    const map = new Map()
    visibleItems.forEach(item => {
      const d = dayKey(item._date)
      if (!map.has(d)) map.set(d, [])
      map.get(d).push(item)
    })
    return [...map.entries()]
  }, [visibleItems])

  const hasMore = visibleCount < filtered.length

  const loadMore = useCallback(() => {
    setVisibleCount(c => c + PAGE_SIZE)
  }, [])

  // Reset page when filters change
  function setMethod(v) { setMethodFilter(v); setVisibleCount(PAGE_SIZE) }
  function setType(v)   { setTypeFilter(v);   setVisibleCount(PAGE_SIZE) }

  const totalFiltered = filtered.length

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Timeline</h1>
          <p className={styles.sub}>
            {loading
              ? 'Loading…'
              : <><span className="mono">{totalFiltered}</span> session{totalFiltered !== 1 ? 's' : ''}</>
            }
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.newBtn}
            onClick={() => navigate('/journal/new')}
          >
            <Plus size={12} strokeWidth={2} />
            New entry
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div className={styles.filters}>
        {/* Type filter */}
        <div className={styles.filterGroup}>
          {[
            { v: 'all',     label: 'All' },
            { v: 'journal', label: 'Journal' },
            { v: 'log',     label: 'Quick logs' },
          ].map(({ v, label }) => (
            <button
              key={v}
              type="button"
              className={[styles.filterBtn, typeFilter === v ? styles.filterActive : ''].join(' ')}
              onClick={() => setType(v)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Method filter */}
        <select
          className={styles.methodSelect}
          value={methodFilter}
          onChange={e => setMethod(e.target.value)}
          aria-label="Filter by method"
        >
          <option value="all">All methods</option>
          {METHODS.map(m => (
            <option key={m} value={m}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Timeline content */}
      {loading ? (
        <div className={styles.empty}>
          <span className="label-caps">Loading</span>
        </div>
      ) : grouped.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No sessions match the current filters.</p>
        </div>
      ) : (
        <>
          <div className={styles.feed}>
            {grouped.map(([dateStr, items]) => (
              <DayGroup key={dateStr} dateStr={dateStr} items={items} />
            ))}
          </div>

          {hasMore && (
            <button type="button" className={styles.loadMore} onClick={loadMore}>
              <ChevronDown size={13} strokeWidth={1.5} />
              Show more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </>
      )}
    </div>
  )
}
