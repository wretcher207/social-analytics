import styles from './MacroBar.module.css'

/**
 * Displays THC and CBD percentages as labelled horizontal progress bars.
 * compact: smaller variant for cards
 */
export function MacroBar({ thc, cbd, compact = false }) {
  if (thc == null && cbd == null) return null

  return (
    <div className={[styles.root, compact ? styles.compact : ''].join(' ')}>
      {thc != null && (
        <div className={styles.row}>
          <span className={styles.label}>THC</span>
          <div className={styles.track}>
            <div
              className={[styles.fill, styles.thc].join(' ')}
              style={{ width: `${Math.min(thc, 100)}%` }}
            />
          </div>
          <span className={styles.value}>{thc}%</span>
        </div>
      )}
      {cbd != null && (
        <div className={styles.row}>
          <span className={styles.label}>CBD</span>
          <div className={styles.track}>
            <div
              className={[styles.fill, styles.cbd].join(' ')}
              style={{ width: `${Math.min(cbd, 100)}%` }}
            />
          </div>
          <span className={styles.value}>{cbd}%</span>
        </div>
      )}
    </div>
  )
}
