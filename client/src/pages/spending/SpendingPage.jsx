import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, ShoppingBag, Layers, DollarSign } from 'lucide-react'
import { getSpendSummary } from '@/lib/products'
import { HorizontalBars } from '@/components/charts/HorizontalBars'
import styles from './SpendingPage.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  flower: 'Flower', concentrate: 'Concentrate', edible: 'Edible',
  vape: 'Vape', tincture: 'Tincture', topical: 'Topical', other: 'Other',
}

function fmt$(n) {
  if (n == null) return '—'
  return `$${Number(n).toFixed(2)}`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtMonth(ym) {
  // "YYYY-MM" → "Jan '25"
  const [y, m] = ym.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className={styles.tile}>
      <div className={styles.tileIcon}><Icon size={16} strokeWidth={1.5} /></div>
      <div>
        <p className={styles.tileValue}>{value}</p>
        <p className={styles.tileLabel}>{label}</p>
        {sub && <p className={styles.tileSub}>{sub}</p>}
      </div>
    </div>
  )
}

function SpendBar({ month, total, max }) {
  const pct = max > 0 ? (total / max) * 100 : 0
  return (
    <div className={styles.spendBar}>
      <span className={styles.spendBarMonth}>{fmtMonth(month)}</span>
      <div className={styles.spendBarTrack}>
        <div className={styles.spendBarFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.spendBarAmt}>{fmt$(total)}</span>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export function SpendingPage() {
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    getSpendSummary()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className={styles.center}>
        <span className="label-caps">Loading spending data…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorMsg}>{error}</p>
      </div>
    )
  }

  const hasData = data?.product_count > 0

  const monthMax = data?.by_month?.length
    ? Math.max(...data.by_month.map(m => m.total))
    : 1

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Spending</h1>
        <p className={styles.sub}>
          Based on <span className="mono">{data?.product_count ?? 0}</span> priced product{data?.product_count !== 1 ? 's' : ''}
        </p>
      </header>

      {!hasData ? (
        <div className={styles.empty}>
          <DollarSign size={32} strokeWidth={1} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No spending data yet</p>
          <p className={styles.emptySub}>
            Add a price when logging products to track your spending.
          </p>
          <button className={styles.emptyLink} type="button" onClick={() => navigate('/products/new')}>
            Add a product
          </button>
        </div>
      ) : (
        <>
          {/* ── Stat tiles ────────────────────────────────────────── */}
          <div className={styles.tiles}>
            <StatTile
              icon={DollarSign}
              label="Total spent"
              value={fmt$(data.total_spent)}
              sub={`across ${data.product_count} product${data.product_count !== 1 ? 's' : ''}`}
            />
            <StatTile
              icon={TrendingUp}
              label="Avg cost per gram"
              value={data.avg_cost_per_g != null ? `${fmt$(data.avg_cost_per_g)}/g` : '—'}
              sub="across all flower/concentrate"
            />
            <StatTile
              icon={Layers}
              label="Categories"
              value={data.by_category?.length ?? 0}
              sub="product types"
            />
            <StatTile
              icon={ShoppingBag}
              label="Months tracked"
              value={data.by_month?.length ?? 0}
              sub={data.by_month?.length > 0 ? `since ${fmtMonth(data.by_month[0].month)}` : ''}
            />
          </div>

          <div className={styles.panels}>
            {/* ── By category ──────────────────────────────────── */}
            {data.by_category?.length > 0 && (
              <div className={styles.panel}>
                <h2 className={styles.panelTitle}>By category</h2>
                <HorizontalBars
                  items={data.by_category.map(c => ({
                    label:    CATEGORY_LABELS[c.category] ?? c.category,
                    value:    c.total,
                    sublabel: c.avg_cost_per_g != null ? `${fmt$(c.avg_cost_per_g)}/g · ${c.count} product${c.count !== 1 ? 's' : ''}` : `${c.count} product${c.count !== 1 ? 's' : ''}`,
                  }))}
                  unit=""
                  colorVar="--color-gold"
                  emptyText="No category data"
                />
              </div>
            )}

            {/* ── Monthly spend ─────────────────────────────────── */}
            {data.by_month?.length > 0 && (
              <div className={[styles.panel, styles.panelFull].join(' ')}>
                <h2 className={styles.panelTitle}>Monthly spend</h2>
                <div className={styles.monthBars}>
                  {data.by_month.map(m => (
                    <SpendBar key={m.month} month={m.month} total={m.total} max={monthMax} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Recent purchases ──────────────────────────────────── */}
          {data.recent?.length > 0 && (
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Recent purchases</h2>
              <div className={styles.recentList}>
                {data.recent.map(r => (
                  <div
                    key={r.id}
                    className={styles.recentRow}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/products/${r.id}`)}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/products/${r.id}`)}
                  >
                    <div className={styles.recentLeft}>
                      <span className={styles.recentName}>{r.name}</span>
                      {r.brand && <span className={styles.recentBrand}>{r.brand}</span>}
                      <span className={styles.recentCat}>
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </span>
                    </div>
                    <div className={styles.recentRight}>
                      <span className={styles.recentPrice}>{fmt$(r.price_paid)}</span>
                      {r.cost_per_g != null && (
                        <span className={styles.recentCpg}>{fmt$(r.cost_per_g)}/g</span>
                      )}
                      <span className={styles.recentDate}>{fmtDate(r.purchased_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
