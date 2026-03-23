import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, FlaskConical, Leaf } from 'lucide-react'
import { listEntries } from '@/lib/journal'
import { listProducts } from '@/lib/products'
import { listStrains } from '@/lib/strains'
import styles from './SearchPage.module.css'

// ── Result row renderers ──────────────────────────────────────────────────────

function JournalResult({ entry, onClick }) {
  const date = entry.session_at
    ? new Date(entry.session_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  return (
    <button type="button" className={styles.result} onClick={onClick}>
      <span className={styles.resultIcon} style={{ color: '#6b9bb8' }}>
        <BookOpen size={13} strokeWidth={1.5} />
      </span>
      <span className={styles.resultBody}>
        <span className={styles.resultName}>{entry.title || 'Untitled entry'}</span>
        <span className={styles.resultMeta}>
          {date && <span>{date}</span>}
          {entry.consumption_method && <span>{entry.consumption_method}</span>}
          {entry.overall_rating && <span>{'★'.repeat(entry.overall_rating)}</span>}
        </span>
      </span>
      <span className={styles.resultType}>Journal</span>
    </button>
  )
}

function ProductResult({ product, onClick }) {
  return (
    <button type="button" className={styles.result} onClick={onClick}>
      <span className={styles.resultIcon} style={{ color: '#c8a96e' }}>
        <FlaskConical size={13} strokeWidth={1.5} />
      </span>
      <span className={styles.resultBody}>
        <span className={styles.resultName}>{product.name}</span>
        <span className={styles.resultMeta}>
          {product.brand && <span>{product.brand}</span>}
          {product.category && <span>{product.category}</span>}
          {product.thc_pct != null && <span>{product.thc_pct}% THC</span>}
        </span>
      </span>
      <span className={styles.resultType}>Product</span>
    </button>
  )
}

function StrainResult({ strain, onClick }) {
  return (
    <button type="button" className={styles.result} onClick={onClick}>
      <span className={styles.resultIcon} style={{ color: '#7dc98c' }}>
        <Leaf size={13} strokeWidth={1.5} />
      </span>
      <span className={styles.resultBody}>
        <span className={styles.resultName}>{strain.name}</span>
        <span className={styles.resultMeta}>
          {strain.brand && <span>{strain.brand}</span>}
          {strain.cultivar_type && <span>{strain.cultivar_type}</span>}
          {strain.thc_pct != null && <span>{strain.thc_pct}% THC</span>}
        </span>
      </span>
      <span className={styles.resultType}>Strain</span>
    </button>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function Section({ title, count, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.sectionCount}>{count}</span>
      </div>
      {children}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 6

export function SearchPage() {
  const navigate = useNavigate()

  const [query,    setQuery]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)
  const [error,    setError]    = useState('')

  const [entries,  setEntries]  = useState([])
  const [products, setProducts] = useState([])
  const [strains,  setStrains]  = useState([])
  const [totals,   setTotals]   = useState({ entries: 0, products: 0, strains: 0 })

  const inputRef   = useRef(null)
  const debounceRef = useRef(null)

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setEntries([]); setProducts([]); setStrains([])
      setTotals({ entries: 0, products: 0, strains: 0 })
      setSearched(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [jRes, pRes, sRes] = await Promise.all([
        listEntries({ q, limit: LIMIT }),
        listProducts({ q, limit: LIMIT }),
        listStrains({ q, limit: LIMIT }),
      ])
      setEntries(jRes.data ?? [])
      setProducts(pRes.data ?? [])
      setStrains(sRes.data ?? [])
      setTotals({
        entries:  jRes.meta?.total ?? 0,
        products: pRes.meta?.total ?? 0,
        strains:  sRes.meta?.total ?? 0,
      })
      setSearched(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(val) {
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(val), 350)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setQuery(''); runSearch('') }
  }

  const totalResults = totals.entries + totals.products + totals.strains
  const hasResults   = entries.length + products.length + strains.length > 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Search</h1>
      </header>

      {/* Search input */}
      <div className={styles.inputWrap}>
        <Search size={16} strokeWidth={1.5} className={styles.inputIcon} />
        <input
          ref={inputRef}
          type="search"
          autoFocus
          className={styles.input}
          placeholder="Search journal, products, strains…"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {loading && <span className={styles.spinner} aria-hidden="true" />}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Results summary */}
      {searched && query.trim() && (
        <p className={styles.summary}>
          {loading ? 'Searching…' : (
            totalResults === 0
              ? `No results for "${query}"`
              : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"`
          )}
        </p>
      )}

      {/* Results */}
      {hasResults && (
        <div className={styles.results}>
          {entries.length > 0 && (
            <Section title="Journal" count={totals.entries}>
              {entries.map(e => (
                <JournalResult
                  key={e.id}
                  entry={e}
                  onClick={() => navigate(`/journal/${e.id}`)}
                />
              ))}
              {totals.entries > LIMIT && (
                <button
                  type="button"
                  className={styles.showMore}
                  onClick={() => navigate(`/journal`)}
                >
                  View all {totals.entries} journal entries →
                </button>
              )}
            </Section>
          )}

          {products.length > 0 && (
            <Section title="Products" count={totals.products}>
              {products.map(p => (
                <ProductResult
                  key={p.id}
                  product={p}
                  onClick={() => navigate(`/products/${p.id}`)}
                />
              ))}
              {totals.products > LIMIT && (
                <button
                  type="button"
                  className={styles.showMore}
                  onClick={() => navigate(`/products`)}
                >
                  View all {totals.products} products →
                </button>
              )}
            </Section>
          )}

          {strains.length > 0 && (
            <Section title="Strains" count={totals.strains}>
              {strains.map(s => (
                <StrainResult
                  key={s.id}
                  strain={s}
                  onClick={() => navigate(`/strains/${s.id}`)}
                />
              ))}
              {totals.strains > LIMIT && (
                <button
                  type="button"
                  className={styles.showMore}
                  onClick={() => navigate(`/strains`)}
                >
                  View all {totals.strains} strains →
                </button>
              )}
            </Section>
          )}
        </div>
      )}

      {/* Empty / idle state */}
      {!hasResults && !loading && (
        <div className={styles.idle}>
          {searched && query.trim() ? (
            <p>No matches found. Try a different term.</p>
          ) : (
            <>
              <Search size={32} strokeWidth={0.75} style={{ opacity: 0.2 }} />
              <p>Search across your journal entries, products, and strains.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
