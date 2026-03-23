import { useEffect, useState, useCallback } from 'react'
import {
  getOverview, getHeatmap, getMethods,
  getByHour, getTopProducts, getTopStrains, getRatingsTrend,
} from '@/lib/analytics'
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap'
import { HorizontalBars }  from '@/components/charts/HorizontalBars'
import { HourHistogram }   from '@/components/charts/HourHistogram'
import { TrendLine }       from '@/components/charts/TrendLine'
import styles from './AnalyticsPage.module.css'

// ── Time range presets ────────────────────────────────────────────────────────
const RANGES = [
  { label: '7d',  days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y',  days: 365 },
  { label: 'All', days: null },
]

function rangeParams(days) {
  if (!days) return {}
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from: from.toISOString().slice(0, 10) }
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit = '', sub = '' }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statVal}>
        {value ?? '—'}
        {value != null && unit && <span className={styles.statUnit}>{unit}</span>}
      </span>
      <span className={styles.statLabel}>{label}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  )
}

// ── Chart panel ───────────────────────────────────────────────────────────────
function Panel({ title, children, fullWidth = false }) {
  return (
    <div className={[styles.panel, fullWidth ? styles.panelFull : ''].join(' ')}>
      <h3 className={styles.panelTitle}>{title}</h3>
      {children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [rangeDays, setRangeDays]   = useState(90)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // Data state
  const [overview, setOverview]     = useState(null)
  const [heatmap, setHeatmap]       = useState([])
  const [methods, setMethods]       = useState([])
  const [byHour, setByHour]         = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topStrains, setTopStrains] = useState([])
  const [trend, setTrend]           = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = rangeParams(rangeDays)

    try {
      const [ov, hm, mt, bh, tp, ts, tr] = await Promise.all([
        getOverview(params),
        getHeatmap(params),
        getMethods(params),
        getByHour(params),
        getTopProducts({ ...params, limit: 8 }),
        getTopStrains({ ...params, limit: 8 }),
        getRatingsTrend({ ...params, bucket: rangeDays && rangeDays <= 90 ? 'week' : 'month' }),
      ])
      setOverview(ov)
      setHeatmap(hm)
      setMethods(mt)
      setByHour(bh)
      setTopProducts(tp)
      setTopStrains(ts)
      setTrend(tr)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [rangeDays])

  useEffect(() => { load() }, [load])

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.sub}>Patterns across your sessions</p>
        </div>
        <div className={styles.rangeBar}>
          {RANGES.map(r => (
            <button
              key={r.label}
              type="button"
              className={[styles.rangeBtn, rangeDays === r.days ? styles.rangeActive : ''].join(' ')}
              onClick={() => setRangeDays(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className={styles.statsRow}>
            <StatCard label="Journal entries"  value={overview?.totalEntries} />
            <StatCard label="Consumption logs" value={overview?.totalLogs} />
            <StatCard label="Active days"      value={overview?.daysActive} />
            <StatCard
              label="Avg rating"
              value={overview?.avgRating}
              unit=" / 5"
              sub={overview?.avgRating ? '★'.repeat(Math.round(overview.avgRating)) : ''}
            />
            <StatCard label="Avg THC" value={overview?.avgThc} unit="%" />
            <StatCard label="Avg CBD" value={overview?.avgCbd} unit="%" />
          </div>

          {/* Calendar heatmap */}
          <Panel title="Activity heatmap" fullWidth>
            <CalendarHeatmap
              data={heatmap}
              weeks={rangeDays == null || rangeDays >= 365 ? 52 : Math.ceil(rangeDays / 7) + 1}
            />
          </Panel>

          {/* Middle row */}
          <div className={styles.grid2}>
            <Panel title="Consumption methods">
              <HorizontalBars
                items={methods.map(m => ({ label: m.method, value: m.count }))}
                colorVar="--color-accent"
                unit=" sessions"
                emptyText="No consumption data yet"
              />
            </Panel>

            <Panel title="Time of day">
              <HourHistogram data={byHour} />
            </Panel>
          </div>

          {/* Bottom row */}
          <div className={styles.grid2}>
            <Panel title="Top products">
              <HorizontalBars
                items={topProducts.map(p => ({
                  label:    p.name,
                  value:    p.count,
                  sublabel: p.brand ? `· ${p.brand}` : '',
                }))}
                colorVar="--color-violet"
                unit=""
                emptyText="No product data yet"
              />
            </Panel>

            <Panel title="Top strains">
              <HorizontalBars
                items={topStrains.map(s => ({
                  label:    s.name,
                  value:    s.count,
                  sublabel: s.cultivar_type ? `· ${s.cultivar_type}` : '',
                }))}
                colorVar="--color-accent"
                unit=""
                emptyText="No strain data yet"
              />
            </Panel>
          </div>

          {/* Rating trend */}
          {trend.length > 1 && (
            <Panel title="Rating trend" fullWidth>
              <TrendLine data={trend} />
            </Panel>
          )}
        </>
      )}
    </div>
  )
}
