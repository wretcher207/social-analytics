import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { listProducts } from '@/lib/products'
import { createEntry } from '@/lib/journal'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CONSUMPTION_METHODS } from '@/lib/constants'
import styles from './QuickLogPanel.module.css'

function toLocalDatetimeStr(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STARS = [1, 2, 3, 4, 5]

export function QuickLogPanel({ onClose }) {
  const navigate = useNavigate()

  const [products, setProducts]     = useState([])
  const [productId, setProductId]   = useState('')
  const [method, setMethod]         = useState('flower')
  const [doseDesc, setDoseDesc]     = useState('')
  const [sessionAt, setSessionAt]   = useState(() => toLocalDatetimeStr(new Date()))
  const [rating, setRating]         = useState(null)
  const [title, setTitle]           = useState('')
  const [notes, setNotes]           = useState('')

  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [savedId, setSavedId]       = useState(null)
  const [error, setError]           = useState('')

  useEffect(() => {
    listProducts({ limit: 200 }).then(r => setProducts(r.data ?? [])).catch(() => {})
  }, [])

  const handleSubmit = useCallback(async e => {
    e.preventDefault()
    if (!productId && !method) { setError('Select a product or method.'); return }
    setSaving(true)
    setError('')
    try {
      const r = await createEntry({
        product_id:          productId || undefined,
        consumption_method:  method || undefined,
        dose_desc:           doseDesc || undefined,
        session_at:          new Date(sessionAt).toISOString(),
        overall_rating:      rating,
        title:               title || undefined,
        body:                notes || undefined,
      })
      setSavedId(r.data?.id ?? null)
      setSaved(true)
    } catch (err) {
      setError(err?.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }, [productId, method, doseDesc, sessionAt, rating, title, notes])

  if (saved) {
    return (
      <Modal title="Session logged" onClose={onClose} width={360}>
        <div className={styles.success}>
          <CheckCircle size={28} strokeWidth={1.2} className={styles.successIcon} />
          <p className={styles.successText}>Your session has been saved.</p>
          <div className={styles.successActions}>
            {savedId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onClose(); navigate(`/journal/${savedId}`) }}
              >
                <ExternalLink size={11} strokeWidth={1.5} /> View entry
              </Button>
            )}
            <Button size="sm" onClick={onClose}>Done</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Quick log" onClose={onClose} width={420}>
      <form className={styles.form} onSubmit={handleSubmit}>

        {/* Product */}
        <div className={styles.field}>
          <label className={styles.label}>Product</label>
          <select
            className={styles.select}
            value={productId}
            onChange={e => setProductId(e.target.value)}
          >
            <option value="">— none —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}{p.brand ? ` · ${p.brand}` : ''}</option>
            ))}
          </select>
        </div>

        {/* Method + Dose in one row */}
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Method</label>
            <select
              className={styles.select}
              value={method}
              onChange={e => setMethod(e.target.value)}
            >
              {CONSUMPTION_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="Dose"
            placeholder="e.g. 0.3g"
            value={doseDesc}
            onChange={e => setDoseDesc(e.target.value)}
          />
        </div>

        {/* Date/time */}
        <Input
          label="When"
          type="datetime-local"
          value={sessionAt}
          onChange={e => setSessionAt(e.target.value)}
        />

        {/* Title */}
        <Input
          label="Title (optional)"
          placeholder="Quick note…"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* Notes */}
        <div className={styles.field}>
          <label className={styles.label}>Notes (optional)</label>
          <textarea
            className={styles.textarea}
            rows={3}
            placeholder="Effects, mood, observations…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Rating */}
        <div className={styles.field}>
          <label className={styles.label}>Overall rating</label>
          <div className={styles.stars}>
            {STARS.map(n => (
              <button
                key={n}
                type="button"
                className={[styles.star, rating >= n ? styles.starOn : ''].join(' ')}
                onClick={() => setRating(prev => prev === n ? null : n)}
                aria-label={`${n} star${n !== 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
            {rating != null && (
              <button type="button" className={styles.clearRating} onClick={() => setRating(null)}>
                clear
              </button>
            )}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving}>Save session</Button>
        </div>
      </form>
    </Modal>
  )
}
