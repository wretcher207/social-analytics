import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createUserClient } from '../lib/supabase.js'
import { paginate, parseUUID, throwDbError } from '../lib/db.js'

export const journalRouter = Router()
journalRouter.use(requireAuth)

const ALLOWED_WRITE_FIELDS = [
  'product_id', 'strain_id', 'title', 'body',
  'mood_before', 'mood_after',
  'energy_before', 'energy_after',
  'anxiety_before', 'anxiety_after',
  'pain_before', 'pain_after',
  'focus_before', 'focus_after',
  'overall_rating',
  'consumption_method', 'dose_mg', 'dose_description', 'setting',
  'effects', 'negatives', 'tags',
  'session_at',
]

// GET /api/journal?page=&limit=&strain_id=&product_id=&from=&to=
journalRouter.get('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from: rowFrom, to: rowTo, page, limit } = paginate(req.query.page, req.query.limit)
  const { strain_id, product_id, from: dateFrom, to: dateTo } = req.query

  let query = db
    .from('journal_entries')
    .select(`
      id, title, session_at, overall_rating, effects, tags,
      consumption_method, dose_description, ai_summary, ai_processed,
      products(id, name, category, brand),
      strains(id, name, cultivar_type)
    `, { count: 'exact' })
    .order('session_at', { ascending: false })
    .range(rowFrom, rowTo)

  if (strain_id)  query = query.eq('strain_id', strain_id)
  if (product_id) query = query.eq('product_id', product_id)
  if (dateFrom)   query = query.gte('session_at', dateFrom)
  if (dateTo)     query = query.lte('session_at', dateTo)

  const { data, error, count } = await query
  if (error) throwDbError(error)

  res.json({ data, meta: { total: count, page, limit } })
}))

// GET /api/journal/:id
journalRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const { data, error } = await db
    .from('journal_entries')
    .select('*, products(*), strains(*)')
    .eq('id', id)
    .single()

  if (error || !data) return res.status(404).json({ message: 'Entry not found.' })
  res.json(data)
}))

// POST /api/journal
journalRouter.post('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)

  const payload = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([k]) => ALLOWED_WRITE_FIELDS.includes(k))
  )
  payload.user_id = req.user.id
  if (!payload.effects)  payload.effects  = []
  if (!payload.negatives) payload.negatives = []
  if (!payload.tags)     payload.tags     = []

  const { data, error } = await db
    .from('journal_entries')
    .insert(payload)
    .select('*, products(id, name, category), strains(id, name, cultivar_type)')
    .single()

  if (error) throwDbError(error)
  res.status(201).json(data)
}))

// PATCH /api/journal/:id
journalRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const updates = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([k]) => ALLOWED_WRITE_FIELDS.includes(k))
  )
  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'No valid fields to update.' })
  }

  const { data, error } = await db
    .from('journal_entries')
    .update(updates)
    .eq('id', id)
    .select('*, products(id, name, category), strains(id, name, cultivar_type)')
    .single()

  if (error) throwDbError(error)
  if (!data) return res.status(404).json({ message: 'Entry not found.' })
  res.json(data)
}))

// DELETE /api/journal/:id
journalRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const { error } = await db.from('journal_entries').delete().eq('id', id)
  if (error) throwDbError(error)
  res.status(204).end()
}))

// GET /api/journal/stats/summary
// Aggregate stats for dashboard widgets (Phase 5 analytics will expand this)
journalRouter.get('/stats/summary', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)

  const { data, error } = await db
    .from('journal_entries')
    .select('overall_rating, effects, negatives, mood_after, energy_after, anxiety_after, pain_after, session_at')

  if (error) throwDbError(error)

  const total = data.length
  const rated = data.filter(e => e.overall_rating != null)
  const avgRating = rated.length
    ? (rated.reduce((s, e) => s + e.overall_rating, 0) / rated.length).toFixed(2)
    : null

  // Top 5 effects by frequency
  const effectCounts = {}
  data.forEach(e => (e.effects ?? []).forEach(ef => {
    effectCounts[ef] = (effectCounts[ef] ?? 0) + 1
  }))
  const topEffects = Object.entries(effectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([effect, count]) => ({ effect, count }))

  res.json({ total, avgRating, topEffects })
}))
