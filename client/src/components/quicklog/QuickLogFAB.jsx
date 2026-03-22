import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { QuickLogPanel } from './QuickLogPanel'
import styles from './QuickLogFAB.module.css'

/**
 * Floating action button (bottom-right) that opens the quick-log panel.
 * Also triggers on keyboard shortcut: `N` (when no input is focused).
 */
export function QuickLogFAB() {
  const [open, setOpen] = useState(false)

  const openPanel  = useCallback(() => setOpen(true),  [])
  const closePanel = useCallback(() => setOpen(false), [])

  // Keyboard shortcut: N (when no input/textarea/select focused)
  useEffect(() => {
    function onKey(e) {
      if (open) return
      if (e.key !== 'n' && e.key !== 'N') return
      const tag = document.activeElement?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || document.activeElement?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      openPanel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, openPanel])

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={openPanel}
        aria-label="Quick log a session (N)"
        title="Quick log  ·  N"
      >
        <Plus size={20} strokeWidth={2} />
      </button>

      {open && <QuickLogPanel onClose={closePanel} />}
    </>
  )
}
