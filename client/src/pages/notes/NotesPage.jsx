import { useState, useCallback, useRef, useEffect } from 'react'
import { Pin, PinOff, Trash2, Plus, Search, X } from 'lucide-react'
import styles from './NotesPage.module.css'

// ── localStorage helpers ───────────────────────────────────────────────────

const LS_KEY = 'quick_notes'

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) ?? [] }
  catch { return [] }
}

function saveNotes(notes) {
  localStorage.setItem(LS_KEY, JSON.stringify(notes))
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Date formatting ────────────────────────────────────────────────────────

function fmtDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffM = Math.floor(diffMs / 60_000)
  if (diffM < 1)   return 'just now'
  if (diffM < 60)  return `${diffM}m ago`
  const diffH = Math.floor(diffM / 60)
  if (diffH < 24)  return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'yesterday'
  if (diffD < 7)   return `${diffD}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Note card ──────────────────────────────────────────────────────────────

function NoteCard({ note, onPin, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(note.content)
  const taRef = useRef(null)

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus()
      taRef.current.selectionStart = taRef.current.value.length
    }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed) onUpdate(note.id, trimmed)
    else onDelete(note.id)
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setDraft(note.content); setEditing(false) }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit()
  }

  // First line as a pseudo-title
  const lines   = note.content.split('\n')
  const title   = lines[0].slice(0, 80)
  const body    = lines.slice(1).join('\n').trim()

  return (
    <div className={[styles.card, note.pinned ? styles.cardPinned : ''].join(' ')}>
      {editing ? (
        <textarea
          ref={taRef}
          className={styles.editArea}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          rows={Math.max(4, draft.split('\n').length + 1)}
        />
      ) : (
        <div
          className={styles.cardBody}
          role="button"
          tabIndex={0}
          onClick={() => { setDraft(note.content); setEditing(true) }}
          onKeyDown={e => e.key === 'Enter' && (setDraft(note.content), setEditing(true))}
        >
          <p className={styles.cardTitle}>{title}</p>
          {body && <p className={styles.cardSnippet}>{body}</p>}
        </div>
      )}

      <div className={styles.cardFooter}>
        <span className={styles.cardDate}>{fmtDate(note.updated_at)}</span>
        <div className={styles.cardActions}>
          <button
            className={styles.iconBtn}
            type="button"
            onClick={() => onPin(note.id)}
            aria-label={note.pinned ? 'Unpin' : 'Pin'}
          >
            {note.pinned
              ? <PinOff size={12} strokeWidth={1.5} />
              : <Pin    size={12} strokeWidth={1.5} />}
          </button>
          <button
            className={[styles.iconBtn, styles.iconBtnDanger].join(' ')}
            type="button"
            onClick={() => onDelete(note.id)}
            aria-label="Delete"
          >
            <Trash2 size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Compose box ────────────────────────────────────────────────────────────

function ComposeBox({ onCreate }) {
  const [open,    setOpen]    = useState(false)
  const [content, setContent] = useState('')
  const taRef = useRef(null)

  useEffect(() => {
    if (open && taRef.current) taRef.current.focus()
  }, [open])

  function submit() {
    const trimmed = content.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setContent('')
    setOpen(false)
  }

  function handleKey(e) {
    if (e.key === 'Escape') { setOpen(false); setContent('') }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit()
  }

  if (!open) {
    return (
      <button className={styles.newBtn} type="button" onClick={() => setOpen(true)}>
        <Plus size={14} strokeWidth={2} /> New note
      </button>
    )
  }

  return (
    <div className={styles.compose}>
      <textarea
        ref={taRef}
        className={styles.composeArea}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKey}
        placeholder="What's on your mind?  (Ctrl+Enter to save, Esc to cancel)"
        rows={4}
      />
      <div className={styles.composeFooter}>
        <span className={styles.composeHint}>Ctrl+Enter to save</span>
        <div className={styles.composeActions}>
          <button
            className={styles.cancelBtn}
            type="button"
            onClick={() => { setOpen(false); setContent('') }}
          >
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            type="button"
            disabled={!content.trim()}
            onClick={submit}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export function NotesPage() {
  const [notes,  setNotes]  = useState(loadNotes)
  const [query,  setQuery]  = useState('')

  const persist = useCallback(n => { setNotes(n); saveNotes(n) }, [])

  function createNote(content) {
    const now = new Date().toISOString()
    persist([{ id: uid(), content, pinned: false, created_at: now, updated_at: now }, ...notes])
  }

  function deleteNote(id) { persist(notes.filter(n => n.id !== id)) }

  function togglePin(id) {
    persist(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
  }

  function updateNote(id, content) {
    persist(notes.map(n =>
      n.id === id ? { ...n, content, updated_at: new Date().toISOString() } : n
    ))
  }

  // Sort: pinned first, then by updated_at desc
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.updated_at) - new Date(a.updated_at)
  })

  const filtered = query.trim()
    ? sorted.filter(n => n.content.toLowerCase().includes(query.toLowerCase()))
    : sorted

  const pinnedCount = notes.filter(n => n.pinned).length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notes</h1>
          <p className={styles.sub}>
            {notes.length} note{notes.length !== 1 ? 's' : ''}
            {pinnedCount > 0 && ` · ${pinnedCount} pinned`}
          </p>
        </div>
      </header>

      {/* Compose */}
      <ComposeBox onCreate={createNote} />

      {/* Search */}
      {notes.length > 3 && (
        <div className={styles.searchWrap}>
          <Search size={13} strokeWidth={1.5} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter notes…"
          />
          {query && (
            <button className={styles.clearSearch} type="button" onClick={() => setQuery('')}>
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <p className={styles.empty}>
          {query ? 'No notes match your search.' : 'No notes yet. Add your first above.'}
        </p>
      ) : (
        <div className={styles.grid}>
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onPin={togglePin}
              onDelete={deleteNote}
              onUpdate={updateNote}
            />
          ))}
        </div>
      )}
    </div>
  )
}
