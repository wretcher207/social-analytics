import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import styles from './Modal.module.css'

/**
 * Accessible modal dialog with focus trap and Escape key dismissal.
 */
export function Modal({ title, children, onClose, width = 480 }) {
  const overlayRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={styles.panel} style={{ maxWidth: width }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
