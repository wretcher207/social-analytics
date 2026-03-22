import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PenLine, Timer, Camera, BarChart2, ChevronRight, Star } from 'lucide-react'
import { getOverview } from '@/lib/analytics'
import { listEntries } from '@/lib/journal'
import { listProducts } from '@/lib/products'
import { getGoals } from '@/lib/goals'
import styles from './DashboardPage.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRelative(iso) {
  if (!iso) return ''
  const diffH = Math.round((Date.now() - new Date(iso)) / 3_600_000)
  if (diffH < 1)   return 'just now'
  if (diffH < 24)  return `${diffH}h ago`
  const diffD = Math.round(diffH / 24)
  if (diffD === 1) return 'yesterday'
  if (diffD < 7)   return `${diffD}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const GOAL_LABELS = {
  max_sessions_per_week: 'Sessions / week',
  min_days_off:          'Days off',
  max_thc_avg:           'Avg THC ceiling',
  tolerance_break:       'Tolerance break',
  custom:                'Custom goal',
}
const goalLabel = g => GOAL_LABELS[g.metric] ?? g.metric ?? 'Goal'
const goalPct   = g => {
  if (!g.target_value) return null
  return Math.min(100, Math.round(((g.current_value ?? 0) / g.target_value) * 100))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stat({ label, value, unit = '', loading }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statVal}>
        {loading
          ? <span className={styles.skel} />
          : <>{value ?? '—'}{value != null && unit && <span className={styles.statUnit}>{unit}</span>}</>}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button className={styles.qa} onClick={onClick} type="button">
      <span className={styles.qaIcon}><Icon size={16} strokeWidth={1.5} /></span>
      <span className={styles.qaLabel}>{label}</span>
    </button>
  )
}

function SectionHead({ title, to, nav }) {
  return (
    <div className={styles.sectionHead}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {to && (
        <button className={styles.seeAll} type="button" onClick={() => nav(to)}>
          See all <ChevronRight size={11} strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading,  setLoading]  = useState(true)
  const [overview, setOverview] = useState(null)
  const [entries,  setEntries]  = useState([])
  const [products, setProducts] = useState([])
  const [goals,    setGoals]    = useState([])

  useEffect(() => {
    Promise.all([
      getOverview().then(setOverview).catch(() => {}),
      listEntries({ limit: 5 }).then(r => setEntries(r.data ?? [])).catch(() => {}),
      listProducts({ limit: 4 }).then(r => setProducts(r.data ?? [])).catch(() => {}),
      getGoals().then(r => setGoals((r ?? []).filter(g => g.status === 'active'))).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'there'

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Overview</h1>
          <p className={styles.sub}>Welcome back, {displayName}</p>
        </div>
      </header>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        <Stat label="Total sessions" value={overview?.totalEntries} loading={loading} />
        <Stat label="Days active"    value={overview?.daysActive}   loading={loading} />
        <Stat label="Avg rating"     value={overview?.avgRating}    unit="/10" loading={loading} />
        <Stat label="Avg THC"        value={overview?.avgThc}       unit="%" loading={loading} />
      </div>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <div className={styles.qaRow}>
        <QuickAction icon={PenLine}   label="New session" onClick={() => navigate('/journal/new')} />
        <QuickAction icon={Timer}     label="Dab timer"   onClick={() => navigate('/dab-timer')} />
        <QuickAction icon={Camera}    label="Scan label"  onClick={() => navigate('/products/new')} />
        <QuickAction icon={BarChart2} label="Analytics"   onClick={() => navigate('/analytics')} />
      </div>

      {/* ── Two-column: sessions + goals ─────────────────────────────── */}
      <div className={styles.grid2}>

        {/* Recent sessions */}
        <section className={styles.panel}>
          <SectionHead title="Recent sessions" to="/journal" nav={navigate} />

          {!loading && entries.length === 0 ? (
            <p className={styles.empty}>
              No sessions yet.{' '}
              <button className={styles.link} onClick={() => navigate('/journal/new')}>
                Add your first
              </button>
            </p>
          ) : (
            <ul className={styles.entryList}>
              {entries.map(e => (
                <li
                  key={e.id}
                  className={styles.entryItem}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/journal/${e.id}`)}
                  onKeyDown={ev => ev.key === 'Enter' && navigate(`/journal/${e.id}`)}
                >
                  <div className={styles.entryMeta}>
                    <span className={styles.entryDate}>{fmtRelative(e.session_at)}</span>
                    {e.overall_rating != null && (
                      <span className={styles.entryRating}>
                        <Star size={10} strokeWidth={1.5} fill="currentColor" />
                        {e.overall_rating}
                      </span>
                    )}
                  </div>
                  {e.products?.name && (
                    <span className={styles.entryProduct}>{e.products.name}</span>
                  )}
                  {e.ai_headline && (
                    <span className={styles.entryHeadline}>{e.ai_headline}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Active goals */}
        <section className={styles.panel}>
          <SectionHead title="Active goals" to="/goals" nav={navigate} />

          {!loading && goals.length === 0 ? (
            <p className={styles.empty}>
              No active goals.{' '}
              <button className={styles.link} onClick={() => navigate('/goals')}>
                Set one
              </button>
            </p>
          ) : (
            <ul className={styles.goalList}>
              {goals.slice(0, 4).map(g => {
                const pct = goalPct(g)
                return (
                  <li key={g.id} className={styles.goalItem}>
                    <div className={styles.goalTop}>
                      <span className={styles.goalLabel}>{goalLabel(g)}</span>
                      {g.target_value != null && (
                        <span className={styles.goalNums}>
                          {g.current_value ?? 0} / {g.target_value}
                        </span>
                      )}
                    </div>
                    {pct != null && (
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ── Recent products ──────────────────────────────────────────── */}
      {(products.length > 0 || loading) && (
        <section>
          <SectionHead title="Recent products" to="/products" nav={navigate} />
          <div className={styles.productGrid}>
            {loading
              ? Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className={[styles.productCard, styles.productSkel].join(' ')} />
                ))
              : products.map(p => (
                  <div
                    key={p.id}
                    className={styles.productCard}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/products/${p.id}`)}
                    onKeyDown={ev => ev.key === 'Enter' && navigate(`/products/${p.id}`)}
                  >
                    <span className={styles.productCat}>{p.category}</span>
                    <span className={styles.productName}>{p.name}</span>
                    {p.brand && <span className={styles.productBrand}>{p.brand}</span>}
                    {p.thc_pct != null && (
                      <span className={styles.productThc}>THC {p.thc_pct}%</span>
                    )}
                  </div>
                ))}
          </div>
        </section>
      )}
    </div>
  )
}
