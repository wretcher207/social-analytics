import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createUserClient } from '../lib/supabase.js'
import { paginate, parseUUID, throwDbError } from '../lib/db.js'

export const consumptionRouter = Router()
consumptionRouter.use(requireAuth)

const ALLOWED_FIELDS = [
  'product_id', 'journal_entry_id', 'method',
  'dose_mg', 'dose_description',
  'started_at', 'duration_minutes', 'notes',
]

// GET /api/consumption?page=&limit=&from=&to=
consumptionRouter.get('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from: rowFrom, to: rowTo, page, limit } = paginate(req.query.page, req.query.limit)
  const { from: dateFrom, to: dateTo, product_id } = req.query

  let query = db
    .from('consumption_logs')
    .select('*, products(id, name, category, brand)', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(rowFrom, rowTo)

  if (dateFrom)   query = query.gte('started_at', dateFrom)
  if (dateTo)     query = query.lte('started_at', dateTo)
  if (product_id) query = query.eq('product_id', product_id)

  const { data, error, count } = await query
  if (error) throwDbError(error)

  res.json({ data, meta: { total: count, page, limit } })
}))

// GET /api/consumption/:id
consumptionRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const { data, error } = await db
    .from('consumption_logs')
    .select('*, products(*)')
    .eq('id', id)
    .single()

  if (error || !data) return res.status(404).json({ message: 'Log not found.' })
  res.json(data)
}))

// POST /api/consumption
consumptionRouter.post('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { method } = req.body ?? {}

  if (!method) return res.status(400).json({ message: 'method is required.' })

  const payload = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([k]) => ALLOWED_FIELDS.includes(k))
  )
  payload.user_id = req.user.id

  const { data, error } = await db
    .from('consumption_logs')
    .insert(payload)
    .select('*, products(id, name, category)')
    .single()

  if (error) throwDbError(error)
  res.status(201).json(data)
}))

// PATCH /api/consumption/:id
consumptionRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const updates = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([k]) => ALLOWED_FIELDS.includes(k))
  )
  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'No valid fields to update.' })
  }

  const { data, error } = await db
    .from('consumption_logs')
    .update(updates)
    .eq('id', id)
    .select('*, products(id, name, category)')
    .single()

  if (error) throwDbError(error)
  if (!data) return res.status(404).json({ message: 'Log not found.' })
  res.json(data)
}))

// DELETE /api/consumption/:id
consumptionRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const { error } = await db.from('consumption_logs').delete().eq('id', id)
  if (error) throwDbError(error)
  res.status(204).end()
}))
