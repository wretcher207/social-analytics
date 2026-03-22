import { useNavigate } from 'react-router-dom'
import styles from './StrainCard.module.css'

export const CULTIVAR_COLOR = {
  indica:   '#8b7baf',
  sativa:   '#7dc98c',
  hybrid:   '#c8a96e',
  cbd:      '#6eb8b8',
  unknown:  '#8a8a8a',
}

export const CULTIVAR_LABEL = {
  indica:  'Indica',
  sativa:  'Sativa',
  hybrid:  'Hybrid',
  cbd:     'High CBD',
  unknown: 'Unknown',
}

export function StrainCard({ strain }) {
  const navigate = useNavigate()
  const color = CULTIVAR_COLOR[strain.cultivar_type] ?? CULTIVAR_COLOR.unknown

  return (
    <article
      className={styles.card}
      onClick={() => navigate(`/strains/${strain.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/strains/${strain.id}`)}
    >
      <div className={styles.top}>
        <span
          className={styles.cultivarBadge}
          style={{ color, borderColor: `${color}55` }}
        >
          {CULTIVAR_LABEL[strain.cultivar_type] ?? strain.cultivar_type ?? 'Unknown'}
        </span>
      </div>

      <div className={styles.main}>
        <h3 className={styles.name}>{strain.name}</h3>
        {strain.brand && <p className={styles.brand}>{strain.brand}</p>}
      </div>

      <div className={styles.bottom}>
        {strain.thc_pct != null && (
          <span className={styles.macro}>
            <span className={styles.macroVal}>{strain.thc_pct}%</span>
            <span className={styles.macroLabel}>THC</span>
          </span>
        )}
        {strain.cbd_pct != null && (
          <span className={styles.macro}>
            <span className={styles.macroVal}>{strain.cbd_pct}%</span>
            <span className={styles.macroLabel}>CBD</span>
          </span>
        )}
        {strain.terpenes?.length > 0 && (
          <span className={styles.terpCount}>
            {strain.terpenes.length} terpene{strain.terpenes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {strain.description && (
        <p className={styles.desc}>{strain.description}</p>
      )}
    </article>
  )
}
