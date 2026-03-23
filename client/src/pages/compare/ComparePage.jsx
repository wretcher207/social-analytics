import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRightLeft, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { listProducts, getProduct } from '@/lib/products'
import { listEntries } from '@/lib/journal'
import styles from './ComparePage.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(v) {
  if (v == null) return null
  return `${parseFloat(v).toFixed(1)}%`
}

function join(arr) {
  if (!arr?.length) return null
  return arr.join(', ')
}

/** Compute avg rating + session count from journal entries for a product */
function computeStats(entries = []) {
  const rated = entries.filter(e => e.overall_rating != null)
  const avg   = rated.length
    ? (rated.reduce((s, e) => s + e.overall_rating, 0) / rated.length).toFixed(1)
    : null
  return { sessions: entries.length, avgRating: avg }
}

// ── Tiny progress bar ─────────────────────────────────────────────────────────

function Bar({ value, max, winner }) {
  const pctW = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className={styles.barWrap}>
      <div
        className={[styles.barFill, winner ? styles.barWinner : ''].join(' ')}
        style={{ width: `${pctW}%` }}
      />
    </div>
  )
}

// ── Stars ─────────────────────────────────────────────────────────────────────

function Stars({ rating }) {
  const n = parseFloat(rating)
  return (
    <span className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={11}
          strokeWidth={1.5}
          fill={i < n ? 'currentColor' : 'none'}
          className={i < n ? styles.starOn : styles.starOff}
        />
      ))}
      <span className={styles.starNum}>{rating}</span>
    </span>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

function Row({ label, a, b, numeric, winner, barMaxA, barMaxB }) {
  const empty = <span className={styles.dash}>—</span>
  return (
    <tr className={styles.row}>
      <td className={styles.cellA}>
        {a != null ? (
          <>
            {numeric != null && (
              <Bar value={parseFloat(a)} max={barMaxA ?? Math.max(parseFloat(a), parseFloat(b ?? 0))} winner={winner === 'a'} />
            )}
            <span className={[styles.cellVal, winner === 'a' ? styles.cellWinner : ''].join(' ')}>
              {a}
            </span>
          </>
        ) : empty}
      </td>
      <td className={styles.cellLabel}>{label}</td>
      <td className={styles.cellB}>
        {b != null ? (
          <>
            {numeric != null && (
              <Bar value={parseFloat(b)} max={barMaxB ?? Math.max(parseFloat(b), parseFloat(a ?? 0))} winner={winner === 'b'} />
            )}
            <span className={[styles.cellVal, winner === 'b' ? styles.cellWinner : ''].join(' ')}>
              {b}
            </span>
          </>
        ) : empty}
      </td>
    </tr>
  )
}

function SectionHead({ label }) {
  return (
    <tr className={styles.sectionRow}>
      <td colSpan={3} className={styles.sectionLabel}>{label}</td>
    </tr>
  )
}

// ── Product picker ────────────────────────────────────────────────────────────

function ProductPicker({ products, value, onChange, placeholder }) {
  return (
    <select
      className={styles.picker}
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
      aria-label={placeholder}
    >
      <option value="">{placeholder}</option>
      {products.map(p => (
        <option key={p.id} value={p.id}>
          {p.name}{p.brand ? ` – ${p.brand}` : ''}{p.thc_pct != null ? ` (${p.thc_pct}% THC)` : ''}
        </option>
      ))}
    </select>
  )
}

// ── Swap icon button ──────────────────────────────────────────────────────────

function SwapBtn({ onClick }) {
  return (
    <button type="button" className={styles.swapBtn} onClick={onClick} title="Swap">
      <ArrowRightLeft size={14} strokeWidth={1.5} />
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ComparePage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const [products, setProducts] = useState([])

  const [idA, setIdA] = useState(params.get('a') ?? null)
  const [idB, setIdB] = useState(params.get('b') ?? null)

  const [prodA, setProdA] = useState(null)
  const [prodB, setProdB] = useState(null)
  const [statsA, setStatsA] = useState(null)
  const [statsB, setStatsB] = useState(null)

  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)

  // Load product list for pickers
  useEffect(() => {
    listProducts({ limit: 200 }).then(r => setProducts(r.data ?? []))
  }, [])

  // Sync URL
  useEffect(() => {
    const next = {}
    if (idA) next.a = idA
    if (idB) next.b = idB
    setParams(next, { replace: true })
  }, [idA, idB]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSide = useCallback(async (id, setProd, setStats, setLoading) => {
    if (!id) { setProd(null); setStats(null); return }
    setLoading(true)
    try {
      const [pRes, eRes] = await Promise.all([
        getProduct(id),
        listEntries({ product_id: id, limit: 500 }),
      ])
      setProd(pRes.data ?? null)
      setStats(computeStats(eRes.data ?? []))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSide(idA, setProdA, setStatsA, setLoadingA) }, [idA, fetchSide])
  useEffect(() => { fetchSide(idB, setProdB, setStatsB, setLoadingB) }, [idB, fetchSide])

  function swap() {
    const tmp = idA; setIdA(idB); setIdB(tmp)
  }

  // ── Derived comparison rows ────────────────────────────────────────────────

  const thcA = prodA?.thc_pct != null ? parseFloat(prodA.thc_pct) : null
  const thcB = prodB?.thc_pct != null ? parseFloat(prodB.thc_pct) : null
  const cbdA = prodA?.cbd_pct != null ? parseFloat(prodA.cbd_pct) : null
  const cbdB = prodB?.cbd_pct != null ? parseFloat(prodB.cbd_pct) : null
  const maxThc = Math.max(thcA ?? 0, thcB ?? 0)
  const maxCbd = Math.max(cbdA ?? 0, cbdB ?? 0)

  const ratingA = statsA?.avgRating != null ? parseFloat(statsA.avgRating) : null
  const ratingB = statsB?.avgRating != null ? parseFloat(statsB.avgRating) : null

  function winner(a, b) {
    if (a == null && b == null) return null
    if (a == null) return 'b'
    if (b == null) return 'a'
    if (a > b) return 'a'
    if (b > a) return 'b'
    return null
  }

  const stockA = prodA != null ? (prodA.stock_g ?? 0) : null
  const stockB = prodB != null ? (prodB.stock_g ?? 0) : null
  const maxStock = Math.max(stockA ?? 0, stockB ?? 0)

  const ready = prodA || prodB

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/products')}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Products
        </button>
        <h1 className={styles.title}>Compare</h1>
      </header>

      {/* Pickers */}
      <div className={styles.pickerRow}>
        <ProductPicker
          products={products}
          value={idA}
          onChange={setIdA}
          placeholder="Select product A"
        />
        <SwapBtn onClick={swap} />
        <ProductPicker
          products={products}
          value={idB}
          onChange={setIdB}
          placeholder="Select product B"
        />
      </div>

      {/* Loading states */}
      {(loadingA || loadingB) && (
        <p className={styles.loading}>Loading…</p>
      )}

      {/* Empty prompt */}
      {!ready && !loadingA && !loadingB && (
        <div className={styles.prompt}>
          <p className={styles.promptText}>
            Select two products above to compare them side by side.
          </p>
        </div>
      )}

      {/* Names header row */}
      {ready && !loadingA && !loadingB && (
        <div className={styles.nameRow}>
          <button
            className={[styles.nameCard, prodA ? '' : styles.nameCardEmpty].join(' ')}
            onClick={() => prodA && navigate(`/products/${prodA.id}`)}
            disabled={!prodA}
          >
            {prodA ? (
              <>
                <span className={styles.prodName}>{prodA.name}</span>
                {prodA.brand && <span className={styles.prodBrand}>{prodA.brand}</span>}
                <span className={styles.categoryBadge}>{prodA.category}</span>
              </>
            ) : (
              <span className={styles.prodNameEmpty}>—</span>
            )}
          </button>

          <span className={styles.vsLabel}>vs</span>

          <button
            className={[styles.nameCard, prodB ? '' : styles.nameCardEmpty].join(' ')}
            onClick={() => prodB && navigate(`/products/${prodB.id}`)}
            disabled={!prodB}
          >
            {prodB ? (
              <>
                <span className={styles.prodName}>{prodB.name}</span>
                {prodB.brand && <span className={styles.prodBrand}>{prodB.brand}</span>}
                <span className={styles.categoryBadge}>{prodB.category}</span>
              </>
            ) : (
              <span className={styles.prodNameEmpty}>—</span>
            )}
          </button>
        </div>
      )}

      {/* Comparison table */}
      {ready && !loadingA && !loadingB && (
        <table className={styles.table}>
          <tbody>

            {/* ── Potency ── */}
            <SectionHead label="Potency" />
            <Row
              label="THC %"
              a={pct(prodA?.thc_pct)}
              b={pct(prodB?.thc_pct)}
              numeric
              barMaxA={maxThc}
              barMaxB={maxThc}
              winner={winner(thcA, thcB)}
            />
            <Row
              label="CBD %"
              a={pct(prodA?.cbd_pct)}
              b={pct(prodB?.cbd_pct)}
              numeric
              barMaxA={maxCbd}
              barMaxB={maxCbd}
              winner={winner(cbdA, cbdB)}
            />

            {/* ── Session stats ── */}
            <SectionHead label="Your experience" />
            <Row
              label="Sessions logged"
              a={statsA?.sessions != null ? String(statsA.sessions) : null}
              b={statsB?.sessions != null ? String(statsB.sessions) : null}
              numeric
              winner={winner(statsA?.sessions ?? null, statsB?.sessions ?? null)}
            />
            <Row
              label="Avg rating"
              a={statsA?.avgRating != null ? (
                <Stars rating={statsA.avgRating} />
              ) : null}
              b={statsB?.avgRating != null ? (
                <Stars rating={statsB.avgRating} />
              ) : null}
              winner={winner(ratingA, ratingB)}
            />

            {/* ── Inventory ── */}
            <SectionHead label="Inventory" />
            <Row
              label="In stock (g)"
              a={stockA != null ? `${stockA} g` : null}
              b={stockB != null ? `${stockB} g` : null}
              numeric
              barMaxA={maxStock}
              barMaxB={maxStock}
              winner={winner(stockA, stockB)}
            />

            {/* ── Profile ── */}
            <SectionHead label="Profile" />
            <Row
              label="Terpenes"
              a={prodA ? join(prodA.terpenes) : null}
              b={prodB ? join(prodB.terpenes) : null}
            />
            <Row
              label="Effects"
              a={prodA ? join(prodA.effects) : null}
              b={prodB ? join(prodB.effects) : null}
            />

          </tbody>
        </table>
      )}
    </div>
  )
}
