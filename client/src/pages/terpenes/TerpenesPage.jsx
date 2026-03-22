import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { listProducts } from '@/lib/products'
import { listStrains } from '@/lib/strains'
import { TERPENES } from '@/lib/constants'
import styles from './TerpenesPage.module.css'

// ── Per-terpene accent colours ────────────────────────────────────────────────
const TERP_COLOR = {
  Myrcene:       '#8b7b5c',
  Limonene:      '#c8b46e',
  Caryophyllene: '#c8826e',
  Linalool:      '#8b7baf',
  Pinene:        '#6b9b6b',
  Humulene:      '#7ba06b',
  Terpinolene:   '#6b97af',
  Ocimene:       '#a0ae6b',
  Bisabolol:     '#af7b9b',
  Valencene:     '#c8966e',
  Geraniol:      '#b06b80',
  Camphene:      '#6b9b8b',
}

const DEFAULT_COLOR = '#8a8a8a'

// ── Build a sorted effect-word list from the terpene note string ──────────────
function effectWords(note) {
  // Extract comma/period separated phrases before effects description
  const parts = note.split('.').map(s => s.trim()).filter(Boolean)
  // First part is aroma, rest may be effects
  return parts.slice(1).join('. ')
}

// ── Terpene card ──────────────────────────────────────────────────────────────

function TerpeneCard({ terp, products, strains, expanded, onToggle }) {
  const navigate = useNavigate()
  const color = TERP_COLOR[terp.name] ?? DEFAULT_COLOR

  // products / strains that contain this terpene
  const matchedProducts = products.filter(p =>
    p.terpenes?.some(t => t.name?.toLowerCase() === terp.name.toLowerCase())
  )
  const matchedStrains = strains.filter(s =>
    s.terpenes?.some(t => t.name?.toLowerCase() === terp.name.toLowerCase())
  )
  const count = matchedProducts.length + matchedStrains.length

  // average % across all matched items
  const allPcts = [
    ...matchedProducts.flatMap(p => p.terpenes?.filter(t => t.name?.toLowerCase() === terp.name.toLowerCase()).map(t => t.pct) ?? []),
    ...matchedStrains.flatMap(s => s.terpenes?.filter(t => t.name?.toLowerCase() === terp.name.toLowerCase()).map(t => t.pct) ?? []),
  ].filter(v => v != null)
  const avgPct = allPcts.length
    ? (allPcts.reduce((a, b) => a + b, 0) / allPcts.length).toFixed(2)
    : null

  // Aroma part (before first period) vs effects
  const noteParts = terp.note.split('.')
  const aroma   = noteParts[0]?.trim() ?? ''
  const effects = noteParts.slice(1).join('.').trim()

  return (
    <div
      className={[styles.card, expanded ? styles.cardExpanded : '', count > 0 ? styles.cardActive : ''].join(' ')}
      style={{ '--terp-color': color }}
    >
      <button
        type="button"
        className={styles.cardHeader}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className={styles.dot} style={{ background: color }} />
        <span className={styles.terpName}>{terp.name}</span>
        <span className={styles.aroma}>{aroma}</span>

        <div className={styles.cardMeta}>
          {count > 0 && (
            <span className={styles.countBadge} style={{ borderColor: `${color}55`, color }}>
              {count} in library
            </span>
          )}
          {avgPct && (
            <span className={styles.pctBadge}>
              {avgPct}% avg
            </span>
          )}
          {expanded
            ? <ChevronUp size={13} strokeWidth={1.5} className={styles.chevron} />
            : <ChevronDown size={13} strokeWidth={1.5} className={styles.chevron} />
          }
        </div>
      </button>

      {expanded && (
        <div className={styles.cardBody}>
          {effects && (
            <p className={styles.effects}>{effects}</p>
          )}

          {matchedProducts.length > 0 && (
            <div className={styles.matchGroup}>
              <span className={styles.matchGroupLabel}>Products</span>
              <div className={styles.chips}>
                {matchedProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={styles.chip}
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedStrains.length > 0 && (
            <div className={styles.matchGroup}>
              <span className={styles.matchGroupLabel}>Strains</span>
              <div className={styles.chips}>
                {matchedStrains.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={styles.chip}
                    onClick={() => navigate(`/strains/${s.id}`)}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {count === 0 && (
            <p className={styles.noMatch}>
              Not found in your current library.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const SORT_OPTS = [
  { value: 'freq',  label: 'By frequency' },
  { value: 'alpha', label: 'A – Z' },
]

export function TerpenesPage() {
  const [products, setProducts] = useState([])
  const [strains,  setStrains]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [sort,     setSort]     = useState('freq')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    Promise.all([
      listProducts({ limit: 200, archived: 'false' }),
      listStrains({ limit: 200 }),
    ])
      .then(([pRes, sRes]) => {
        setProducts(pRes.data ?? [])
        setStrains(sRes.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  // For each known terpene, compute library count
  const terpeneRows = useMemo(() => {
    return TERPENES.map(terp => {
      const pCount = products.filter(p =>
        p.terpenes?.some(t => t.name?.toLowerCase() === terp.name.toLowerCase())
      ).length
      const sCount = strains.filter(s =>
        s.terpenes?.some(t => t.name?.toLowerCase() === terp.name.toLowerCase())
      ).length
      return { ...terp, libCount: pCount + sCount }
    })
  }, [products, strains])

  const sorted = useMemo(() => {
    if (sort === 'alpha') return [...terpeneRows].sort((a, b) => a.name.localeCompare(b.name))
    return [...terpeneRows].sort((a, b) => b.libCount - a.libCount || a.name.localeCompare(b.name))
  }, [terpeneRows, sort])

  // Also collect terpenes in user library NOT in the known list
  const knownNames = new Set(TERPENES.map(t => t.name.toLowerCase()))
  const extraTerps = useMemo(() => {
    const extra = {}
    ;[...products, ...strains].forEach(item => {
      ;(item.terpenes ?? []).forEach(t => {
        if (t.name && !knownNames.has(t.name.toLowerCase())) {
          extra[t.name] = (extra[t.name] ?? 0) + 1
        }
      })
    })
    return Object.entries(extra)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, note: '', libCount: count }))
  }, [products, strains]) // eslint-disable-line react-hooks/exhaustive-deps

  const libraryTotal = terpeneRows.filter(t => t.libCount > 0).length + extraTerps.length

  function toggle(name) {
    setExpanded(v => v === name ? null : name)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Terpenes</h1>
          <p className={styles.sub}>
            {loading
              ? 'Loading library…'
              : <><span className="mono">{libraryTotal}</span> terpenes identified across your library</>
            }
          </p>
        </div>

        {/* Sort toggle */}
        <div className={styles.sortGroup} role="group" aria-label="Sort order">
          {SORT_OPTS.map(o => (
            <button
              key={o.value}
              type="button"
              className={[styles.sortBtn, sort === o.value ? styles.sortActive : ''].join(' ')}
              onClick={() => setSort(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>
          <span className="label-caps">Loading</span>
        </div>
      ) : (
        <>
          {/* Known terpenes */}
          <div className={styles.list}>
            {sorted.map(terp => (
              <TerpeneCard
                key={terp.name}
                terp={terp}
                products={products}
                strains={strains}
                expanded={expanded === terp.name}
                onToggle={() => toggle(terp.name)}
              />
            ))}
          </div>

          {/* Extra terpenes (in library but not in known list) */}
          {extraTerps.length > 0 && (
            <section className={styles.extraSection}>
              <h3 className={styles.extraTitle}>Also in your library</h3>
              <div className={styles.extraList}>
                {extraTerps.map(t => (
                  <span key={t.name} className={styles.extraPill}>
                    {t.name}
                    <span className={styles.extraCount}>{t.libCount}</span>
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
