import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Archive } from 'lucide-react'
import { listProducts } from '@/lib/products'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/products/ProductCard'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import styles from './ProductsPage.module.css'

const ALL_CATS = [{ value: '', label: 'All' }, ...PRODUCT_CATEGORIES]

export function ProductsPage() {
  const navigate = useNavigate()

  const [products, setProducts]   = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [category, setCategory]   = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const LIMIT = 24

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: LIMIT, archived: showArchived }
      if (category) params.category = category
      const res = await listProducts(params)
      setProducts(res.data ?? [])
      setTotal(res.meta?.total ?? 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, category, showArchived])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.sub}>
            <span className="mono">{total}</span> products in your library
          </p>
        </div>
        <Button onClick={() => navigate('/products/new')} size="md">
          <Plus size={14} strokeWidth={1.5} />
          Add product
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.catFilters}>
          {ALL_CATS.map(c => (
            <button
              key={c.value}
              type="button"
              className={[styles.catBtn, category === c.value ? styles.catActive : ''].join(' ')}
              onClick={() => { setCategory(c.value); setPage(1) }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={[styles.archiveToggle, showArchived ? styles.archiveActive : ''].join(' ')}
          onClick={() => { setShowArchived(v => !v); setPage(1) }}
        >
          <Archive size={12} strokeWidth={1.5} />
          Archived
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <div className={styles.empty}>
          <span className="label-caps">Loading products</span>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <p className="label-caps">No products {category ? `in ${category}` : ''}</p>
          <p>Add products from your dispensary to start tracking sessions.</p>
          <Button onClick={() => navigate('/products/new')} variant="ghost" size="md">
            <Plus size={14} strokeWidth={1.5} />
            Add first product
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
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
