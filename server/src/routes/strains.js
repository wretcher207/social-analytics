import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createUserClient } from '../lib/supabase.js'
import { paginate, parseUUID, throwDbError } from '../lib/db.js'

export const strainsRouter = Router()
strainsRouter.use(requireAuth)

// GET /api/strains?q=&page=&limit=&type=
// Returns global strains + the user's own strains
strainsRouter.get('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to, page, limit } = paginate(req.query.page, req.query.limit)
  const { q, type } = req.query

  let query = db
    .from('strains')
    .select('*', { count: 'exact' })
    .order('name')
    .range(from, to)

  if (q) query = query.ilike('name', `%${q}%`)
  if (type) query = query.eq('cultivar_type', type)

  const { data, error, count } = await query
  if (error) throwDbError(error)

  res.json({ data, meta: { total: count, page, limit } })
}))

// GET /api/strains/:id
strainsRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const { data, error } = await db
    .from('strains')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return res.status(404).json({ message: 'Strain not found.' })
  }
  res.json(data)
}))

// POST /api/strains
strainsRouter.post('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const {
    name, brand, cultivar_type, thc_pct, cbd_pct,
    terpenes, lineage, description, image_url,
  } = req.body ?? {}

  if (!name?.trim()) {
    return res.status(400).json({ message: 'name is required.' })
  }

  const { data, error } = await db
    .from('strains')
    .insert({
      user_id: req.user.id,
      name: name.trim(),
      brand, cultivar_type: cultivar_type ?? 'unknown',
      thc_pct, cbd_pct,
      terpenes: terpenes ?? [],
      lineage, description, image_url,
    })
    .select()
    .single()

  if (error) throwDbError(error)
  res.status(201).json(data)
}))

// PATCH /api/strains/:id
strainsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const allowed = [
    'name', 'brand', 'cultivar_type', 'thc_pct', 'cbd_pct',
    'terpenes', 'lineage', 'description', 'image_url',
  ]
  const updates = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([k]) => allowed.includes(k))
  )

  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'No valid fields to update.' })
  }

  const { data, error } = await db
    .from('strains')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throwDbError(error)
  if (!data) return res.status(404).json({ message: 'Strain not found or not editable.' })
  res.json(data)
}))

// DELETE /api/strains/:id
strainsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const { error } = await db
    .from('strains')
    .delete()
    .eq('id', id)

  if (error) throwDbError(error)
  res.status(204).end()
}))
