import styles from './EffectTag.module.css'

/**
 * variant: 'effect' | 'negative' | 'tag' | 'terpene'
 * interactive: if true, renders with a remove button
 */
export function EffectTag({ label, variant = 'effect', onRemove, onClick }) {
  return (
    <span
      className={[styles.tag, styles[variant], onClick ? styles.clickable : ''].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          className={styles.remove}
          onClick={e => { e.stopPropagation(); onRemove() }}
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  )
}
