import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createUserClient, supabaseAdmin } from '../lib/supabase.js'
import { throwDbError, parseUUID } from '../lib/db.js'

export const goalsRouter = Router()
goalsRouter.use(requireAuth)

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Monday of the week containing `date` at 00:00:00 local UTC. */
function weekBounds(now) {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  const day = d.getUTCDay()                   // 0=Sun … 6=Sat
  const daysBack = (day + 6) % 7             // days since Monday
  const start = new Date(d)
  start.setUTCDate(d.getUTCDate() - daysBack)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 7)
  return { start, end }
}

/** Enrich a goal row with computed progress fields. */
function enrichGoal(goal, weekCount) {
  if (goal.type === 'frequency') {
    const max = goal.max_per_week ?? 1
    return {
      ...goal,
      progress: {
        current_week: weekCount,
        max_per_week: max,
        on_track:     weekCount <= max,
        pct:          Math.min(weekCount / max, 1),
      },
    }
  }

  // tolerance_break
  const now     = Date.now()
  const started = new Date(goal.started_at).getTime()
  const elapsed = Math.floor((now - started) / 86_400_000)
  const total   = goal.duration_days
  const remaining = total != null ? Math.max(total - elapsed, 0) : null
  const pct       = total ? Math.min(elapsed / total, 1) : 0
  const isComplete = goal.completed || remaining === 0

  return {
    ...goal,
    progress: {
      elapsed_days:   elapsed,
      remaining_days: remaining,
      duration_days:  total,
      pct,
      is_complete:    isComplete,
    },
  }
}

// ── GET /api/goals ────────────────────────────────────────────────────────────
// Returns all goals with computed progress.

goalsRouter.get('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)

  const [{ data: goals, error }, weekData] = await Promise.all([
    db.from('goals').select('*').order('created_at', { ascending: false }),
    (async () => {
      const { start, end } = weekBounds(new Date())
      return db
        .from('journal_entries')
        .select('id')
        .gte('session_at', start.toISOString())
        .lt('session_at', end.toISOString())
    })(),
  ])

  if (error) throwDbError(error)

  const weekCount = weekData.data?.length ?? 0
  res.json((goals ?? []).map(g => enrichGoal(g, weekCount)))
}))

// ── POST /api/goals ───────────────────────────────────────────────────────────

goalsRouter.post('/', asyncHandler(async (req, res) => {
  const { type, title, max_per_week, duration_days, notes } = req.body ?? {}

  if (!['frequency', 'tolerance_break'].includes(type)) {
    const e = new Error("type must be 'frequency' or 'tolerance_break'")
    e.status = 400; throw e
  }
  if (!title?.trim()) {
    const e = new Error('title is required')
    e.status = 400; throw e
  }

  const now = new Date()
  const row = {
    user_id:    req.user.id,
    type,
    title:      title.trim(),
    notes:      notes?.trim() || null,
    started_at: now.toISOString(),
    completed:  false,
  }

  if (type === 'frequency') {
    const n = Number(max_per_week)
    if (!n || n < 1) {
      const e = new Error('max_per_week must be ≥ 1')
      e.status = 400; throw e
    }
    row.max_per_week = n
  } else {
    const n = Number(duration_days)
    if (!n || n < 1) {
      const e = new Error('duration_days must be ≥ 1')
      e.status = 400; throw e
    }
    row.duration_days = n
    row.ends_at = new Date(now.getTime() + n * 86_400_000).toISOString()
  }

  const { data, error } = await supabaseAdmin
    .from('goals')
    .insert(row)
    .select()
    .single()

  if (error) throwDbError(error)
  res.status(201).json(data)
}))

// ── PATCH /api/goals/:id ──────────────────────────────────────────────────────

goalsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const { completed, notes, title } = req.body ?? {}

  const updates = { updated_at: new Date().toISOString() }
  if (completed !== undefined) updates.completed = Boolean(completed)
  if (notes     !== undefined) updates.notes     = notes?.trim() || null
  if (title     !== undefined) updates.title     = title?.trim() || null

  const { data, error } = await supabaseAdmin
    .from('goals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single()

  if (error) throwDbError(error)
  if (!data) { const e = new Error('Not found'); e.status = 404; throw e }

  res.json(data)
}))

// ── DELETE /api/goals/:id ─────────────────────────────────────────────────────

goalsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)

  const { error } = await supabaseAdmin
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)

  if (error) throwDbError(error)
  res.status(204).end()
}))
