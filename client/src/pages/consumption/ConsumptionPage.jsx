import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { listLogs, createLog, deleteLog, METHODS, METHOD_COLOR } from '@/lib/consumption'
import { listProducts } from '@/lib/products'
import { Button } from '@/components/ui/Button'
import styles from './ConsumptionPage.module.css'

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowLocalISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function fmtRelative(iso) {
  if (!iso) return ''
  const diffH = Math.round((Date.now() - new Date(iso)) / 3_600_000)
  if (diffH < 1)   return 'just now'
  if (diffH < 24)  return `${diffH}h ago`
  const diffD = Math.round(diffH / 24)
  if (diffD === 1) return 'yesterday'
  if (diffD < 7)   return `${diffD}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDuration(mins) {
  if (!mins) return null
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const BLANK_FORM = {
  method:           'dab',
  product_id:       '',
  started_at:       '',
  dose_description: '',
  duration_minutes: '',
  notes:            '',
}

// ── Log row ───────────────────────────────────────────────────────────────────

function LogRow({ log, onDelete, confirmId, setConfirmId }) {
  const color  = METHOD_COLOR[log.method] ?? METHOD_COLOR.other
  const isConf = confirmId === log.id

  return (
    <li className={styles.logRow}>
      <div className={styles.logLeft}>
        <span className={styles.methodPill} style={{ borderColor: `${color}60`, color }}>
          {log.method}
        </span>

        <div className={styles.logMeta}>
          <span className={styles.logTime}>{fmtRelative(log.started_at)}</span>

          {log.products?.name && (
            <span className={styles.logProduct}>{log.products.name}</span>
          )}

          {(log.dose_description || log.duration_minutes) && (
            <span className={styles.logDetail}>
              {log.dose_description}
              {log.dose_description && log.duration_minutes ? ' · ' : ''}
              {fmtDuration(log.duration_minutes)}
            </span>
          )}

          {log.notes && (
            <span className={styles.logNotes}>{log.notes}</span>
          )}
        </div>
      </div>

      <div className={styles.logActions}>
        {isConf ? (
          <>
            <button
              className={styles.confirmBtn}
              type="button"
              onClick={() => { onDelete(log.id); setConfirmId(null) }}
            >
              Delete
            </button>
            <button
              className={styles.cancelBtn}
              type="button"
              onClick={() => setConfirmId(null)}
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          </>
        ) : (
          <button
            className={styles.deleteBtn}
            type="button"
            onClick={() => setConfirmId(log.id)}
            title="Delete log"
          >
            <Trash2 size={13} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </li>
  )
}

// ── Log form ──────────────────────────────────────────────────────────────────

function LogForm({ onSave, onCancel, products }) {
  const [form, setForm]       = useState({ ...BLANK_FORM, started_at: nowLocalISO() })
  const [submitting, setSub]  = useState(false)
  const [error, setError]     = useState('')
  const firstRef              = useRef(null)

  useEffect(() => { firstRef.current?.focus() }, [])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSub(true)
    setError('')
    try {
      const payload = {
        method:     form.method,
        started_at: form.started_at ? new Date(form.started_at).toISOString() : new Date().toISOString(),
      }
      if (form.product_id)       payload.product_id       = form.product_id
      if (form.dose_description) payload.dose_description = form.dose_description.trim()
      if (form.duration_minutes) payload.duration_minutes = Number(form.duration_minutes)
      if (form.notes)            payload.notes             = form.notes.trim()

      const saved = await createLog(payload)
      onSave(saved)
    } catch (err) {
      setError(err.message ?? 'Failed to save.')
    } finally {
      setSub(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formGrid}>
        {/* Method */}
        <label className={styles.fieldLabel}>
          Method
          <select
            className={styles.select}
            value={form.method}
            onChange={e => set('method', e.target.value)}
            ref={firstRef}
          >
            {METHODS.map(m => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        </label>

        {/* Product */}
        <label className={styles.fieldLabel}>
          Product (optional)
          <select
            className={styles.select}
            value={form.product_id}
            onChange={e => set('product_id', e.target.value)}
          >
            <option value="">— none —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        {/* Started at */}
        <label className={styles.fieldLabel}>
          Time
          <input
            type="datetime-local"
            className={styles.input}
            value={form.started_at}
            onChange={e => set('started_at', e.target.value)}
          />
        </label>

        {/* Dose */}
        <label className={styles.fieldLabel}>
          Dose (optional)
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. 0.1g, 10mg"
            value={form.dose_description}
            onChange={e => set('dose_description', e.target.value)}
            maxLength={80}
          />
        </label>

        {/* Duration */}
        <label className={styles.fieldLabel}>
          Duration (minutes)
          <input
            type="number"
            className={styles.input}
            placeholder="e.g. 15"
            value={form.duration_minutes}
            onChange={e => set('duration_minutes', e.target.value)}
            min={0}
            max={1440}
          />
        </label>
      </div>

      {/* Notes — full width */}
      <label className={styles.fieldLabel}>
        Notes (optional)
        <textarea
          className={styles.textarea}
          placeholder="Quick notes…"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          maxLength={500}
        />
      </label>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save log'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const LIMIT = 20

export function ConsumptionPage() {
  const [logs,       setLogs]       = useState([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [showForm,   setShowForm]   = useState(false)
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [products,   setProducts]   = useState([])
  const [confirmId,  setConfirmId]  = useState(null)

  const totalPages = Math.ceil(total / LIMIT)

  // Fetch products for the form selector (once)
  useEffect(() => {
    listProducts({ limit: 20 }).then(r => setProducts(r.data ?? [])).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: LIMIT }
      if (dateFrom) params.from = dateFrom
      if (dateTo)   params.to   = dateTo
      const res = await listLogs(params)
      setLogs(res.data ?? [])
      setTotal(res.meta?.total ?? 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  function handleSaved(newLog) {
    setShowForm(false)
    setPage(1)
    load()
  }

  async function handleDelete(id) {
    try {
      await deleteLog(id)
      setLogs(prev => prev.filter(l => l.id !== id))
      setTotal(t => t - 1)
    } catch (err) {
      setError(err.message)
    }
  }

  function applyFilters() {
    setPage(1)
    load()
  }

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className={styles.page}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Log</h1>
          <p className={styles.sub}>
            <span className="mono">{total}</span> consumption records
          </p>
        </div>
        <Button size="md" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X size={14} strokeWidth={1.5} /> : <Plus size={14} strokeWidth={1.5} />}
          {showForm ? 'Cancel' : 'New entry'}
        </Button>
      </header>

      {/* ── Quick-log form ───────────────────────────────────────────── */}
      {showForm && (
        <div className={styles.formPanel}>
          <LogForm
            products={products}
            onSave={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* ── Date filters ─────────────────────────────────────────────── */}
      <div className={styles.filters}>
        <label className={styles.filterLabel}>
          From
          <input
            type="date"
            className={styles.filterInput}
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </label>
        <label className={styles.filterLabel}>
          To
          <input
            type="date"
            className={styles.filterInput}
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </label>
        <button className={styles.applyBtn} type="button" onClick={applyFilters}>
          Apply
        </button>
        {(dateFrom || dateTo) && (
          <button className={styles.clearBtn} type="button" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && <p className={styles.error}>{error}</p>}

      {/* ── List ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className={styles.loadingState}>
          <span className="label-caps">Loading…</span>
        </div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>
          <p className="label-caps">No logs{dateFrom || dateTo ? ' in range' : ''}</p>
          <p>Quick-log a session with the button above.</p>
        </div>
      ) : (
        <ul className={styles.logList}>
          {logs.map(log => (
            <LogRow
              key={log.id}
              log={log}
              onDelete={handleDelete}
              confirmId={confirmId}
              setConfirmId={setConfirmId}
            />
          ))}
        </ul>
      )}

      {/* ── Pagination ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={14} strokeWidth={1.5} /> Prev
          </Button>
          <span className={styles.pageInfo}>
            <span className="mono">{page}</span> / <span className="mono">{totalPages}</span>
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight size={14} strokeWidth={1.5} />
          </Button>
        </div>
      )}
    </div>
  )
}
