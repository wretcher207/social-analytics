import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, CheckCircle, AlertTriangle, Target, Flame } from 'lucide-react'
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/lib/goals'
import { Button } from '@/components/ui/Button'
import styles from './GoalsPage.module.css'

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, danger }) {
  return (
    <div className={styles.progressTrack}>
      <div
        className={[styles.progressFill, danger ? styles.danger : ''].join(' ')}
        style={{ width: `${Math.min(pct * 100, 100).toFixed(1)}%` }}
      />
    </div>
  )
}

// ── Tolerance Break card ──────────────────────────────────────────────────────
function ToleranceCard({ goal, onComplete, onDelete }) {
  const p = goal.progress
  const done = p.is_complete

  return (
    <div className={[styles.card, done ? styles.cardDone : ''].join(' ')}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}><Flame size={14} strokeWidth={1.5} /></div>
        <div className={styles.cardMeta}>
          <span className={styles.cardType}>Tolerance Break</span>
          <h3 className={styles.cardTitle}>{goal.title}</h3>
        </div>
        <button className={styles.deleteBtn} onClick={() => onDelete(goal.id)} aria-label="Delete goal">
          <Trash2 size={13} strokeWidth={1.5} />
        </button>
      </div>

      <div className={styles.breakStats}>
        <div className={styles.dayBig}>
          <span className={styles.dayNum}>{p.elapsed_days}</span>
          <span className={styles.dayLabel}>day{p.elapsed_days !== 1 ? 's' : ''} sober</span>
        </div>
        {!done && p.remaining_days != null && (
          <div className={styles.dayRemain}>
            <span>{p.remaining_days}</span>
            <span className={styles.dayLabel}>remaining</span>
          </div>
        )}
        {done && (
          <div className={styles.completedBadge}>
            <CheckCircle size={13} strokeWidth={1.5} />
            Complete
          </div>
        )}
      </div>

      {p.duration_days != null && (
        <ProgressBar pct={p.pct} danger={false} />
      )}

      {goal.notes && <p className={styles.notes}>{goal.notes}</p>}

      <div className={styles.cardFooter}>
        <span className={styles.footerDate}>
          Started {new Date(goal.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          {goal.ends_at && ` · ends ${new Date(goal.ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
        </span>
        {!done && !goal.completed && (
          <Button size="xs" variant="ghost" onClick={() => onComplete(goal.id)}>
            <CheckCircle size={11} strokeWidth={1.5} />
            Mark complete
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Frequency card ────────────────────────────────────────────────────────────
function FrequencyCard({ goal, onDelete }) {
  const p = goal.progress
  const over = !p.on_track

  return (
    <div className={[styles.card, over ? styles.cardOver : ''].join(' ')}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon}><Target size={14} strokeWidth={1.5} /></div>
        <div className={styles.cardMeta}>
          <span className={styles.cardType}>Session Limit</span>
          <h3 className={styles.cardTitle}>{goal.title}</h3>
        </div>
        <button className={styles.deleteBtn} onClick={() => onDelete(goal.id)} aria-label="Delete goal">
          <Trash2 size={13} strokeWidth={1.5} />
        </button>
      </div>

      <div className={styles.freqStats}>
        <span className={[styles.freqNum, over ? styles.freqOver : ''].join(' ')}>
          {p.current_week}
        </span>
        <span className={styles.freqSep}>/</span>
        <span className={styles.freqMax}>{p.max_per_week}</span>
        <span className={styles.freqUnit}>sessions this week</span>
        {p.on_track
          ? <span className={styles.onTrack}>On track</span>
          : <span className={styles.offTrack}><AlertTriangle size={11} strokeWidth={1.5} /> Over limit</span>
        }
      </div>

      <ProgressBar pct={p.pct} danger={over} />

      {goal.notes && <p className={styles.notes}>{goal.notes}</p>}

      <div className={styles.cardFooter}>
        <span className={styles.footerDate}>Resets every Monday</span>
      </div>
    </div>
  )
}

// ── Add Goal Form ─────────────────────────────────────────────────────────────
function AddGoalForm({ onCreated, onCancel }) {
  const [type,         setType]         = useState('tolerance_break')
  const [title,        setTitle]        = useState('')
  const [maxPerWeek,   setMaxPerWeek]   = useState(3)
  const [durationDays, setDurationDays] = useState(30)
  const [notes,        setNotes]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [err,          setErr]          = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setErr('')
    try {
      const body = { type, title, notes }
      if (type === 'frequency') body.max_per_week = maxPerWeek
      else body.duration_days = durationDays
      const goal = await createGoal(body)
      onCreated(goal)
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.addForm}>
      <div className={styles.typeToggle}>
        {[
          { val: 'tolerance_break', label: 'Tolerance break' },
          { val: 'frequency',       label: 'Session limit' },
        ].map(({ val, label }) => (
          <button
            key={val}
            type="button"
            className={[styles.typeBtn, type === val ? styles.typeBtnActive : ''].join(' ')}
            onClick={() => setType(val)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.formFields}>
        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input
            className={styles.input}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={type === 'tolerance_break' ? 'e.g. 30-day reset' : 'e.g. Keep it chill'}
            required
            maxLength={80}
          />
        </div>

        {type === 'tolerance_break' ? (
          <div className={styles.field}>
            <label className={styles.label}>Duration (days)</label>
            <input
              className={styles.input}
              type="number"
              min={1}
              max={365}
              value={durationDays}
              onChange={e => setDurationDays(Number(e.target.value))}
            />
          </div>
        ) : (
          <div className={styles.field}>
            <label className={styles.label}>Max sessions per week</label>
            <input
              className={styles.input}
              type="number"
              min={1}
              max={21}
              value={maxPerWeek}
              onChange={e => setMaxPerWeek(Number(e.target.value))}
            />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Notes <span className={styles.optional}>(optional)</span></label>
          <input
            className={styles.input}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Why you're setting this goal…"
            maxLength={200}
          />
        </div>
      </div>

      {err && (
        <p className={styles.formErr}>
          <AlertTriangle size={12} strokeWidth={1.5} />
          {err}
        </p>
      )}

      <div className={styles.formActions}>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" loading={saving}>
          <Plus size={12} strokeWidth={1.5} />
          Create goal
        </Button>
      </div>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function GoalsPage() {
  const [goals,     setGoals]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [fetchErr,  setFetchErr]  = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [showDone,  setShowDone]  = useState(false)

  const load = useCallback(() =>
    getGoals()
      .then(setGoals)
      .catch(e => setFetchErr(e.message))
      .finally(() => setLoading(false)),
  [])

  useEffect(() => { load() }, [load])

  function handleCreated(goal) {
    setGoals(gs => [goal, ...gs])
    setShowForm(false)
  }

  async function handleComplete(id) {
    const updated = await updateGoal(id, { completed: true })
    setGoals(gs => gs.map(g => g.id === id ? { ...g, ...updated, progress: g.progress } : g))
    // Refresh to get recalculated progress
    load()
  }

  async function handleDelete(id) {
    await deleteGoal(id)
    setGoals(gs => gs.filter(g => g.id !== id))
  }

  const active    = goals.filter(g => !g.completed && !(g.progress?.is_complete))
  const completed = goals.filter(g =>  g.completed ||   g.progress?.is_complete)

  if (loading) {
    return (
      <div className={styles.loading}>
        {[1, 2].map(i => <div key={i} className={styles.skeletonCard} />)}
      </div>
    )
  }

  if (fetchErr) {
    return (
      <div className={styles.errorWrap}>
        <AlertTriangle size={14} strokeWidth={1.5} />
        {fetchErr}
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Goals</h1>
          <p className={styles.pageDesc}>Track tolerance breaks and session limits.</p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={13} strokeWidth={1.5} />
            New goal
          </Button>
        )}
      </div>

      {showForm && (
        <AddGoalForm
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Active goals */}
      {active.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <Target size={28} strokeWidth={1} className={styles.emptyIcon} />
          <p>No active goals.</p>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={12} strokeWidth={1.5} />
            Set your first goal
          </Button>
        </div>
      ) : (
        <div className={styles.goalsList}>
          {active.map(g =>
            g.type === 'tolerance_break'
              ? <ToleranceCard key={g.id} goal={g} onComplete={handleComplete} onDelete={handleDelete} />
              : <FrequencyCard key={g.id} goal={g} onDelete={handleDelete} />
          )}
        </div>
      )}

      {/* Completed goals */}
      {completed.length > 0 && (
        <section className={styles.doneSection}>
          <button
            className={styles.doneSectionToggle}
            onClick={() => setShowDone(s => !s)}
          >
            <span>Completed / archived</span>
            <span className={styles.doneCount}>{completed.length}</span>
            <span className={styles.doneChevron}>{showDone ? '▲' : '▼'}</span>
          </button>
          {showDone && (
            <div className={styles.goalsList}>
              {completed.map(g =>
                g.type === 'tolerance_break'
                  ? <ToleranceCard key={g.id} goal={g} onComplete={handleComplete} onDelete={handleDelete} />
                  : <FrequencyCard key={g.id} goal={g} onDelete={handleDelete} />
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
