import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Archive, ArchiveX, Plus, BookOpen, GitCompare } from 'lucide-react'
import { FavoriteBtn } from '@/components/ui/FavoriteBtn'
import { getProduct, updateProduct } from '@/lib/products'
import { listEntries } from '@/lib/journal'
import { createLog } from '@/lib/consumption'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { MacroBar } from '@/components/products/MacroBar'
import { EntryCard } from '@/components/journal/EntryCard'
import { CONSUMPTION_METHODS } from '@/lib/constants'
import styles from './ProductDetailPage.module.css'

const SUBCAT_LABELS = {
  live_resin: 'Live Resin', live_rosin: 'Live Rosin', rosin: 'Rosin',
  wax: 'Wax', shatter: 'Shatter', badder: 'Badder', sugar: 'Sugar',
  diamonds: 'Diamonds', sauce: 'Sauce', hash: 'Hash',
  distillate: 'Distillate', rso: 'RSO', other: 'Other',
}

// ── Quick Consumption Log Modal ───────────────────────────────────────────────
function QuickLogModal({ product, onClose, onSaved }) {
  const [method, setMethod]   = useState(
    product.category === 'concentrate' ? 'dab' :
    product.category === 'edible'      ? 'edible' :
    product.category === 'vape'        ? 'vape' : 'flower'
  )
  const [dose, setDose]       = useState('')
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createLog({
        product_id:      product.id,
        method,
        dose_description: dose || undefined,
        notes:           notes || undefined,
        started_at:      new Date().toISOString(),
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Quick session log" onClose={onClose} width={440}>
      <form className={styles.logForm} onSubmit={handleSubmit}>
        <div className={styles.logField}>
          <label className={styles.logLabel}>Method</label>
          <div className={styles.logMethods}>
            {CONSUMPTION_METHODS.slice(0, 6).map(m => (
              <button
                key={m.value}
                type="button"
                className={[styles.logMethodBtn, method === m.value ? styles.logMethodActive : ''].join(' ')}
                onClick={() => setMethod(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.logField}>
          <label className={styles.logLabel}>
            Dose <span className={styles.logOptional}>(optional)</span>
          </label>
          <input
            className={styles.logInput}
            value={dose}
            onChange={e => setDose(e.target.value)}
            placeholder="e.g. one small dab, 10mg"
          />
        </div>

        <div className={styles.logField}>
          <label className={styles.logLabel}>
            Notes <span className={styles.logOptional}>(optional)</span>
          </label>
          <textarea
            className={styles.logTextarea}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Quick note…"
            rows={3}
          />
        </div>

        {error && <p className={styles.logError}>{error}</p>}

        <div className={styles.logActions}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Log session</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main detail page ──────────────────────────────────────────────────────────
export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [product, setProduct]       = useState(null)
  const [entries, setEntries]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [archiving, setArchiving]   = useState(false)
  const [showLog, setShowLog]       = useState(false)

  function load() {
    setLoading(true)
    Promise.all([
      getProduct(id),
      listEntries({ product_id: id, limit: 5 }),
    ])
      .then(([p, j]) => { setProduct(p); setEntries(j.data ?? []) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleArchive() {
    setArchiving(true)
    try {
      const updated = await updateProduct(id, { archived: !product.archived })
      setProduct(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setArchiving(false)
    }
  }

  if (loading) {
    return <div className={styles.center}><span className="label-caps">Loading</span></div>
  }
  if (!product) {
    return (
      <div className={styles.center}>
        <p className={styles.errorMsg}>{error || 'Product not found.'}</p>
        <Button variant="ghost" onClick={() => navigate('/products')}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Products
        </Button>
      </div>
    )
  }

  const strain = product.strains
  const inventoryPct = product.weight_g && product.remaining_g != null
    ? Math.min((product.remaining_g / product.weight_g) * 100, 100)
    : null
  const pricePerG = product.price_paid && product.weight_g
    ? (product.price_paid / product.weight_g).toFixed(2)
    : null

  return (
    <div className={styles.page}>
      {showLog && (
        <QuickLogModal
          product={product}
          onClose={() => setShowLog(false)}
          onSaved={load}
        />
      )}

      {/* Nav */}
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/products')}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Products
        </button>
        <div className={styles.topActions}>
          <FavoriteBtn type="products" id={id} size={13} />
          <Button variant="ghost" size="sm" onClick={() => navigate(`/compare?a=${id}`)}>
            <GitCompare size={12} strokeWidth={1.5} /> Compare
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/products/${id}/edit`)}>
            <Edit2 size={12} strokeWidth={1.5} /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={archiving}
            onClick={toggleArchive}
          >
            {product.archived
              ? <><ArchiveX size={12} strokeWidth={1.5} /> Unarchive</>
              : <><Archive size={12} strokeWidth={1.5} /> Archive</>
            }
          </Button>
        </div>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={styles.catBadge}>
            {product.category}
            {product.subcategory && ` · ${SUBCAT_LABELS[product.subcategory] ?? product.subcategory}`}
          </span>
          {product.archived && <span className={styles.archivedBadge}>Archived</span>}
        </div>
        <h1 className={styles.name}>{product.name}</h1>
        {product.brand && <p className={styles.brand}>{product.brand}</p>}
        {strain && (
          <p className={styles.strain}>
            {strain.name}
            {strain.cultivar_type && <span> · {strain.cultivar_type}</span>}
          </p>
        )}
        {product.dispensary && <p className={styles.dispensary}>{product.dispensary}</p>}
      </header>

      {/* Stats row */}
      <div className={styles.statsGrid}>
        {product.thc_pct != null && (
          <div className={styles.stat}>
            <span className={styles.statVal}>{product.thc_pct}<span>%</span></span>
            <span className={styles.statLabel}>THC</span>
          </div>
        )}
        {product.cbd_pct != null && (
          <div className={styles.stat}>
            <span className={styles.statVal}>{product.cbd_pct}<span>%</span></span>
            <span className={styles.statLabel}>CBD</span>
          </div>
        )}
        {pricePerG && (
          <div className={styles.stat}>
            <span className={styles.statVal}>${pricePerG}<span>/g</span></span>
            <span className={styles.statLabel}>Price per gram</span>
          </div>
        )}
        {product.price_paid != null && (
          <div className={styles.stat}>
            <span className={styles.statVal}>${product.price_paid}</span>
            <span className={styles.statLabel}>Paid</span>
          </div>
        )}
      </div>

      {/* MacroBar */}
      {(product.thc_pct != null || product.cbd_pct != null) && (
        <MacroBar thc={product.thc_pct} cbd={product.cbd_pct} />
      )}

      {/* Inventory */}
      {inventoryPct !== null && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Inventory</h3>
          <div className={styles.invRow}>
            <div className={styles.invTrack}>
              <div className={styles.invFill} style={{ width: `${inventoryPct}%` }} />
            </div>
            <span className={styles.invLabel}>
              {product.remaining_g}g remaining of {product.weight_g}g
            </span>
          </div>
        </section>
      )}

      {/* Terpenes */}
      {product.terpenes?.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Terpene profile</h3>
          <div className={styles.terpList}>
            {[...product.terpenes]
              .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
              .map(t => (
                <div key={t.name} className={styles.terpRow}>
                  <span className={styles.terpName}>{t.name}</span>
                  <div className={styles.terpTrack}>
                    <div
                      className={styles.terpFill}
                      style={{ width: `${Math.min((t.pct ?? 0) * 50, 100)}%` }}
                    />
                  </div>
                  <span className={styles.terpPct}>
                    {t.pct != null ? `${t.pct}%` : '—'}
                  </span>
                </div>
              ))
            }
          </div>
        </section>
      )}

      {/* Purchase details */}
      {(product.batch_number || product.purchased_at) && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Purchase details</h3>
          <dl className={styles.dl}>
            {product.batch_number && (
              <><dt>Batch</dt><dd className="mono">{product.batch_number}</dd></>
            )}
            {product.purchased_at && (
              <><dt>Purchased</dt><dd>{new Date(product.purchased_at).toLocaleDateString()}</dd></>
            )}
          </dl>
        </section>
      )}

      {/* Quick log + journal entries */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Sessions</h3>
          <div className={styles.sectionActions}>
            <Button variant="ghost" size="sm" onClick={() => setShowLog(true)}>
              <Plus size={12} strokeWidth={1.5} /> Quick log
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/journal/new?product_id=${id}`)}
            >
              <BookOpen size={12} strokeWidth={1.5} /> Full entry
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <p className={styles.noEntries}>No journal entries for this product yet.</p>
        ) : (
          <div className={styles.entryList}>
            {entries.map(e => <EntryCard key={e.id} entry={e} />)}
          </div>
        )}
      </section>
    </div>
  )
}
