import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Package, Leaf } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { getProduct } from '@/lib/products'
import { getStrain } from '@/lib/strains'
import { FavoriteBtn } from '@/components/ui/FavoriteBtn'
import styles from './FavoritesPage.module.css'

// ── Product row ───────────────────────────────────────────────────────────────

function ProductRow({ id }) {
  const navigate = useNavigate()
  const [prod, setProd] = useState(null)

  useEffect(() => {
    getProduct(id).then(r => setProd(r.data ?? null))
  }, [id])

  if (!prod) return <div className={styles.skeleton} />

  return (
    <button type="button" className={styles.row} onClick={() => navigate(`/products/${id}`)}>
      <Package size={14} strokeWidth={1.5} className={styles.rowIcon} />
      <div className={styles.rowInfo}>
        <span className={styles.rowName}>{prod.name}</span>
        {prod.brand && <span className={styles.rowSub}>{prod.brand}</span>}
      </div>
      <div className={styles.rowMeta}>
        {prod.thc_pct != null && (
          <span className={styles.chip}>THC {prod.thc_pct}%</span>
        )}
        <span className={styles.chip}>{prod.category}</span>
      </div>
      <FavoriteBtn type="products" id={id} size={13} />
    </button>
  )
}

// ── Strain row ────────────────────────────────────────────────────────────────

function StrainRow({ id }) {
  const navigate = useNavigate()
  const [strain, setStrain] = useState(null)

  useEffect(() => {
    getStrain(id).then(r => setStrain(r.data ?? null))
  }, [id])

  if (!strain) return <div className={styles.skeleton} />

  return (
    <button type="button" className={styles.row} onClick={() => navigate(`/strains/${id}`)}>
      <Leaf size={14} strokeWidth={1.5} className={styles.rowIcon} />
      <div className={styles.rowInfo}>
        <span className={styles.rowName}>{strain.name}</span>
        {strain.brand && <span className={styles.rowSub}>{strain.brand}</span>}
      </div>
      <div className={styles.rowMeta}>
        {strain.cultivar_type && (
          <span className={styles.chip}>{strain.cultivar_type}</span>
        )}
        {strain.thc_pct != null && (
          <span className={styles.chip}>THC {strain.thc_pct}%</span>
        )}
      </div>
      <FavoriteBtn type="strains" id={id} size={13} />
    </button>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ label, Icon, children, count }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHead}>
        <Icon size={13} strokeWidth={1.5} />
        {label}
        <span className={styles.sectionCount}>{count}</span>
      </h2>
      <div className={styles.sectionBody}>
        {count === 0
          ? <p className={styles.emptySection}>No favorites yet.</p>
          : children
        }
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function FavoritesPage() {
  const { favorites } = useFavorites()
  const productIds = favorites.products ?? []
  const strainIds  = favorites.strains  ?? []
  const total = productIds.length + strainIds.length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Heart size={16} strokeWidth={1.5} className={styles.headerIcon} />
        <div>
          <h1 className={styles.title}>Favorites</h1>
          <p className={styles.sub}>
            {total === 0
              ? 'Nothing saved yet'
              : <><span className="mono">{total}</span> item{total !== 1 ? 's' : ''} saved</>
            }
          </p>
        </div>
      </header>

      {total === 0 ? (
        <div className={styles.emptyState}>
          <Heart size={32} strokeWidth={1} className={styles.emptyHeart} />
          <p className={styles.emptyText}>
            Tap the <Heart size={12} strokeWidth={1.5} style={{ display: 'inline', verticalAlign: 'middle' }} /> heart
            on any product or strain to save it here.
          </p>
        </div>
      ) : (
        <>
          <Section label="Products" Icon={Package} count={productIds.length}>
            {productIds.map(id => <ProductRow key={id} id={id} />)}
          </Section>

          <Section label="Strains" Icon={Leaf} count={strainIds.length}>
            {strainIds.map(id => <StrainRow key={id} id={id} />)}
          </Section>
        </>
      )}
    </div>
  )
}
