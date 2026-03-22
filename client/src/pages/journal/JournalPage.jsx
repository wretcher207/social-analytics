import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, SlidersHorizontal, Tag } from 'lucide-react'
import { listEntries, getJournalTags } from '@/lib/journal'
import { Button } from '@/components/ui/Button'
import { EntryCard } from '@/components/journal/EntryCard'
import styles from './JournalPage.module.css'

const METHODS = [
  { value: '', label: 'All methods' },
  { value: 'flower', label: 'Flower' },
  { value: 'dab', label: 'Dab' },
  { value: 'vape', label: 'Vape' },
  { value: 'edible', label: 'Edible' },
]

export function JournalPage() {
  const navigate = useNavigate()
  const [entries, setEntries]     = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [method, setMethod]       = useState('')
  const [tag, setTag]             = useState('')
  const [availTags, setAvailTags] = useState([])

  // Load available tags once
  useEffect(() => {
    getJournalTags()
      .then(r => setAvailTags(r.tags ?? []))
      .catch(() => {})
  }, [])

  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: LIMIT }
      if (method) params.method = method
      if (tag)    params.tag    = tag
      const res = await listEntries(params)
      setEntries(res.data ?? [])
      setTotal(res.meta?.total ?? 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, method, tag])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Journal</h1>
          <p className={styles.sub}>
            <span className="mono">{total}</span> entries
          </p>
        </div>
        <Button onClick={() => navigate('/journal/new')} size="md">
          <Plus size={14} strokeWidth={1.5} />
          New entry
        </Button>
      </header>

      <div className={styles.toolbar}>
        <SlidersHorizontal size={13} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)' }} />
        <div className={styles.filters}>
          {METHODS.map(m => (
            <button
              key={m.value}
              type="button"
              className={[styles.filter, method === m.value ? styles.filterActive : ''].join(' ')}
              onClick={() => { setMethod(m.value); setPage(1) }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {availTags.length > 0 && (
        <div className={styles.toolbar}>
          <Tag size={12} strokeWidth={1.5} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <div className={styles.filters}>
            <button
              type="button"
              className={[styles.filter, !tag ? styles.filterActive : ''].join(' ')}
              onClick={() => { setTag(''); setPage(1) }}
            >
              All tags
            </button>
            {availTags.map(({ tag: t, count }) => (
              <button
                key={t}
                type="button"
                className={[styles.filter, styles.filterTag, tag === t ? styles.filterTagActive : ''].join(' ')}
                onClick={() => { setTag(tag === t ? '' : t); setPage(1) }}
                title={`${count} entr${count !== 1 ? 'ies' : 'y'}`}
              >
                {t}
                <span className={styles.filterCount}>{count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <div className={styles.loading}>
          <span className="label-caps">Loading entries</span>
        </div>
      ) : entries.length === 0 ? (
        <div className={styles.empty}>
          <p className="label-caps">No entries yet</p>
          <p>Start your first session log to begin building your terpene profile.</p>
          <Button onClick={() => navigate('/journal/new')} variant="ghost" size="md">
            <Plus size={14} strokeWidth={1.5} />
            Create first entry
          </Button>
        </div>
      ) : (
        <div className={styles.list}>
          {entries.map(entry => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="ghost" size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            Prev
          </Button>
          <span className={styles.pageInfo}>
            <span className="mono">{page}</span>
            <span> / </span>
            <span className="mono">{totalPages}</span>
          </span>
          <Button
            variant="ghost" size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
