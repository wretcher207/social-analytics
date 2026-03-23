import styles from './RatingRow.module.css'

const PIPS = [1, 2, 3, 4, 5]

/**
 * A 1–5 pip-style rating input.
 *
 * @param {{ label: string, value: number|null, onChange: (v:number)=>void, readOnly?: boolean }} props
 */
export function RatingRow({ label, value, onChange, readOnly = false }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.pips} role={readOnly ? undefined : 'group'} aria-label={label}>
        {PIPS.map(n => (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            className={[
              styles.pip,
              value != null && n <= value ? styles.filled : '',
              readOnly ? styles.readOnly : '',
            ].join(' ')}
            onClick={() => !readOnly && onChange(value === n ? null : n)}
            aria-label={`${label} ${n}`}
            aria-pressed={value === n}
          />
        ))}
      </div>
      <span className={styles.val}>{value ?? '—'}</span>
    </div>
  )
}
