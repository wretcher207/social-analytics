import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { listStrains } from '@/lib/strains'
import { Button } from '@/components/ui/Button'
import { StrainCard } from '@/components/strains/StrainCard'
import { CULTIVAR_TYPES } from '@/lib/constants'
import styles from './StrainsPage.module.css'

const ALL_TYPES = [{ value: '', label: 'All' }, ...CULTIVAR_TYPES]
const LIMIT = 24

export function StrainsPage() {
  const navigate = useNavigate()

  const [strains,  setStrains]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [type,     setType]     = useState('')
  const [query,    setQuery]    = useState('')
  const [search,   setSearch]   = useState('')  // debounced

  const debounceRef = useRef(null)

  function handleQueryChange(val) {
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 300)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: LIMIT }
      if (type)   params.type = type
      if (search) params.q    = search
      const res = await listStrains(params)
      setStrains(res.data ?? [])
      setTotal(res.meta?.total ?? 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, type, search])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Strains</h1>
          <p className={styles.sub}>
            <span className="mono">{total}</span> strains in your library
          </p>
        </div>
        <Button onClick={() => navigate('/strains/new')} size="md">
          <Plus size={14} strokeWidth={1.5} />
          Add strain
        </Button>
      </header>

      <div className={styles.toolbar}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={13} strokeWidth={1.5} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search strains…"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
          />
        </div>

        {/* Type filter chips */}
        <div className={styles.typeFilters}>
          {ALL_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              className={[styles.typeBtn, type === t.value ? styles.typeActive : ''].join(' ')}
              onClick={() => { setType(t.value); setPage(1) }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <div className={styles.empty}>
          <span className="label-caps">Loading strains</span>
        </div>
      ) : strains.length === 0 ? (
        <div className={styles.empty}>
          <p className="label-caps">No strains {type ? `(${type})` : ''}{search ? ` matching "${search}"` : ''}</p>
          <p>Add strains to build your genetics library.</p>
          <Button onClick={() => navigate('/strains/new')} variant="ghost" size="md">
            <Plus size={14} strokeWidth={1.5} />
            Add first strain
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {strains.map(s => <StrainCard key={s.id} strain={s} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Prev
          </Button>
          <span className={styles.pageInfo}>
            <span className="mono">{page}</span> / <span className="mono">{totalPages}</span>
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
