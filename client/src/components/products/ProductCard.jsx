import { useNavigate } from 'react-router-dom'
import { MacroBar } from './MacroBar'
import styles from './ProductCard.module.css'

const CATEGORY_LABELS = {
  flower: 'Flower', concentrate: 'Concentrate', edible: 'Edible',
  vape: 'Vape', tincture: 'Tincture', topical: 'Topical', other: 'Other',
}

const SUBCAT_LABELS = {
  live_resin: 'Live Resin', live_rosin: 'Live Rosin', rosin: 'Rosin',
  wax: 'Wax', shatter: 'Shatter', badder: 'Badder', sugar: 'Sugar',
  diamonds: 'Diamonds', sauce: 'Sauce', hash: 'Hash',
  distillate: 'Distillate', rso: 'RSO', other: 'Other',
}

export function ProductCard({ product }) {
  const navigate = useNavigate()
  const strain = product.strains

  const inventoryPct = product.weight_g && product.remaining_g != null
    ? Math.min((product.remaining_g / product.weight_g) * 100, 100)
    : null

  return (
    <article
      className={[styles.card, product.archived ? styles.archived : ''].join(' ')}
      onClick={() => navigate(`/products/${product.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/products/${product.id}`)}
    >
      <div className={styles.top}>
        <div className={styles.categoryBadge}>
          {CATEGORY_LABELS[product.category] ?? product.category}
          {product.subcategory && (
            <span className={styles.subcat}>
              {' · '}{SUBCAT_LABELS[product.subcategory] ?? product.subcategory}
            </span>
          )}
        </div>
        {product.archived && <span className={styles.archivedBadge}>Archived</span>}
      </div>

      <div className={styles.main}>
        <h3 className={styles.name}>{product.name}</h3>
        {product.brand && <p className={styles.brand}>{product.brand}</p>}
        {strain && (
          <p className={styles.strain}>
            {strain.name}
            {strain.cultivar_type && (
              <span className={styles.cultivar}> · {strain.cultivar_type}</span>
            )}
          </p>
        )}
      </div>

      <MacroBar thc={product.thc_pct} cbd={product.cbd_pct} compact />

      {inventoryPct !== null && (
        <div className={styles.inventoryRow}>
          <div className={styles.inventoryTrack}>
            <div
              className={styles.inventoryFill}
              style={{ width: `${inventoryPct}%` }}
            />
          </div>
          <span className={styles.inventoryLabel}>
            {product.remaining_g != null ? `${product.remaining_g}g` : '—'}
            {product.weight_g ? ` / ${product.weight_g}g` : ''}
          </span>
        </div>
      )}

      {product.dispensary && (
        <p className={styles.dispensary}>{product.dispensary}</p>
      )}
    </article>
  )
}
