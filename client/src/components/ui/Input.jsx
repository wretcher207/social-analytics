import { forwardRef } from 'react'
import styles from './Input.module.css'

export const Input = forwardRef(function Input(
  { label, error, hint, id, type = 'text', className = '', ...rest },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={[styles.input, error ? styles.hasError : '', className].join(' ')}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
    </div>
  )
})
