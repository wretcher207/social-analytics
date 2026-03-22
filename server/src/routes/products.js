import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createUserClient } from '../lib/supabase.js'
import { paginate, parseUUID, throwDbError } from '../lib/db.js'

export const productsRouter = Router()
productsRouter.use(requireAuth)

const ALLOWED_FIELDS = [
  'name', 'category', 'subcategory', 'brand', 'dispensary',
  'batch_number', 'sku', 'thc_pct', 'cbd_pct', 'terpenes',
  'weight_g', 'remaining_g', 'price_paid', 'image_url',
  'label_image_url', 'purchased_at', 'archived', 'strain_id',
]

// GET /api/products?category=&archived=&page=&limit=
productsRouter.get('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to, page, limit } = paginate(req.query.page, req.query.limit)
  const { category, archived } = req.query

  let query = db
    .from('products')
    .select('*, strains(id, name, cultivar_type)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (category) query = query.eq('category', category)
  if (archived !== undefined) query = query.eq('archived', archived === 'true')
  else query = query.eq('archived', false)  // default: hide archived

  const { data, error, count } = await query
  if (error) throwDbError(error)

  res.json({ data, meta: { total: count, page, limit } })
}))

// GET /api/products/:id
productsRouter.get('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const { data, error } = await db
    .from('products')
    .select('*, strains(*)')
    .eq('id', id)
    .single()

  if (error || !data) return res.status(404).json({ message: 'Product not found.' })
  res.json(data)
}))

// POST /api/products
productsRouter.post('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { name, category } = req.body ?? {}

  if (!name?.trim()) return res.status(400).json({ message: 'name is required.' })
  if (!category)       return res.status(400).json({ message: 'category is required.' })

  const payload = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([k]) => ALLOWED_FIELDS.includes(k))
  )
  payload.user_id = req.user.id
  payload.name = name.trim()
  if (payload.terpenes == null) payload.terpenes = []

  const { data, error } = await db
    .from('products')
    .insert(payload)
    .select('*, strains(id, name, cultivar_type)')
    .single()

  if (error) throwDbError(error)
  res.status(201).json(data)
}))

// PATCH /api/products/:id
productsRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const updates = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([k]) => ALLOWED_FIELDS.includes(k))
  )
  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: 'No valid fields to update.' })
  }

  const { data, error } = await db
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('*, strains(id, name, cultivar_type)')
    .single()

  if (error) throwDbError(error)
  if (!data) return res.status(404).json({ message: 'Product not found.' })
  res.json(data)
}))

// DELETE /api/products/:id
productsRouter.delete('/:id', asyncHandler(async (req, res) => {
  const id = parseUUID(req.params.id)
  const db = createUserClient(req.accessToken)

  const { error } = await db.from('products').delete().eq('id', id)
  if (error) throwDbError(error)
  res.status(204).end()
}))
