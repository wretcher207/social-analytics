import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { EffectTag } from './EffectTag'
import styles from './EntryCard.module.css'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const METHOD_LABELS = {
  flower: 'Flower', dab: 'Dab', vape: 'Vape',
  edible: 'Edible', tincture: 'Tincture', sublingual: 'Sublingual',
  topical: 'Topical', other: 'Other',
}

export function EntryCard({ entry }) {
  const navigate = useNavigate()
  const strain  = entry.strains
  const product = entry.products

  return (
    <article
      className={styles.card}
      onClick={() => navigate(`/journal/${entry.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/journal/${entry.id}`)}
    >
      <div className={styles.top}>
        <div className={styles.meta}>
          <span className={styles.date}>{formatDate(entry.session_at)}</span>
          {entry.consumption_method && (
            <span className={styles.method}>{METHOD_LABELS[entry.consumption_method] ?? entry.consumption_method}</span>
          )}
          {entry.ai_processed && (
            <span className={styles.aiFlag} title="AI-analyzed">
              <Sparkles size={10} strokeWidth={1.5} />
            </span>
          )}
        </div>

        {entry.overall_rating != null && (
          <span className={styles.rating}>{entry.overall_rating}<span>/5</span></span>
        )}
      </div>

      {(product || strain) && (
        <p className={styles.product}>
          {product?.name ?? strain?.name}
          {(product?.brand ?? strain?.brand) && (
            <span className={styles.brand}> · {product?.brand ?? strain?.brand}</span>
          )}
        </p>
      )}

      {entry.title && <h3 className={styles.title}>{entry.title}</h3>}

      {entry.ai_summary && (
        <p className={styles.summary}>{entry.ai_summary}</p>
      )}

      {entry.effects?.length > 0 && (
        <div className={styles.tags}>
          {entry.effects.slice(0, 5).map(e => (
            <EffectTag key={e} label={e} variant="effect" />
          ))}
          {entry.effects.length > 5 && (
            <span className={styles.overflow}>+{entry.effects.length - 5}</span>
          )}
        </div>
      )}
    </article>
  )
}
