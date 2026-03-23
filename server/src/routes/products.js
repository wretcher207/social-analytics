import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createUserClient } from '../lib/supabase.js'
import { paginate, parseUUID, throwDbError } from '../lib/db.js'
import { anthropic, AI_MODEL } from '../lib/anthropic.js'

export const productsRouter = Router()
productsRouter.use(requireAuth)

const ALLOWED_FIELDS = [
  'name', 'category', 'subcategory', 'brand', 'dispensary',
  'batch_number', 'sku', 'thc_pct', 'cbd_pct', 'terpenes',
  'weight_g', 'remaining_g', 'price_paid', 'image_url',
  'label_image_url', 'purchased_at', 'archived', 'strain_id',
]

// GET /api/products?category=&archived=&page=&limit=&q=
productsRouter.get('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to, page, limit } = paginate(req.query.page, req.query.limit)
  const { category, archived, q } = req.query

  let query = db
    .from('products')
    .select('*, strains(id, name, cultivar_type)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (category) query = query.eq('category', category)
  if (archived !== undefined) query = query.eq('archived', archived === 'true')
  else query = query.eq('archived', false)  // default: hide archived
  if (q) query = query.ilike('name', `%${q}%`)

  const { data, error, count } = await query
  if (error) throwDbError(error)

  res.json({ data, meta: { total: count, page, limit } })
}))

// GET /api/products/spend-summary
productsRouter.get('/spend-summary', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)

  const { data, error } = await db
    .from('products')
    .select('id, name, category, brand, price_paid, weight_g, purchased_at, archived')
    .order('purchased_at', { ascending: false })

  if (error) throwDbError(error)

  const rows = data ?? []
  const priced = rows.filter(r => r.price_paid != null && r.price_paid > 0)

  // ── Totals ────────────────────────────────────────────────────────────────
  const total_spent   = priced.reduce((s, r) => s + Number(r.price_paid), 0)
  const product_count = priced.length
  const total_weight  = priced.reduce((s, r) => s + (r.weight_g ? Number(r.weight_g) : 0), 0)
  const avg_cost_per_g = total_weight > 0 ? total_spent / total_weight : null

  // ── By category ───────────────────────────────────────────────────────────
  const catMap = {}
  priced.forEach(r => {
    if (!catMap[r.category]) catMap[r.category] = { total: 0, count: 0, weight: 0 }
    catMap[r.category].total  += Number(r.price_paid)
    catMap[r.category].count  += 1
    catMap[r.category].weight += r.weight_g ? Number(r.weight_g) : 0
  })
  const by_category = Object.entries(catMap)
    .map(([category, v]) => ({
      category,
      total:          Math.round(v.total * 100) / 100,
      count:          v.count,
      avg_cost_per_g: v.weight > 0 ? Math.round((v.total / v.weight) * 100) / 100 : null,
    }))
    .sort((a, b) => b.total - a.total)

  // ── By month (last 24 months) ─────────────────────────────────────────────
  const monthMap = {}
  priced.forEach(r => {
    if (!r.purchased_at) return
    const m = r.purchased_at.slice(0, 7)   // "YYYY-MM"
    monthMap[m] = (monthMap[m] ?? 0) + Number(r.price_paid)
  })
  const by_month = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-24)
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))

  // ── Recent purchases (10 most recent with price) ──────────────────────────
  const recent = priced.slice(0, 10).map(r => ({
    id:           r.id,
    name:         r.name,
    brand:        r.brand,
    category:     r.category,
    price_paid:   Number(r.price_paid),
    weight_g:     r.weight_g ? Number(r.weight_g) : null,
    cost_per_g:   r.weight_g ? Math.round((Number(r.price_paid) / Number(r.weight_g)) * 100) / 100 : null,
    purchased_at: r.purchased_at,
    archived:     r.archived,
  }))

  res.json({
    total_spent:   Math.round(total_spent * 100) / 100,
    product_count,
    avg_cost_per_g: avg_cost_per_g ? Math.round(avg_cost_per_g * 100) / 100 : null,
    by_category,
    by_month,
    recent,
  })
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

// ── POST /api/products/ocr ────────────────────────────────────────────────────
// Vision-based label / COA extraction.
// Body: { image: base64string, media_type: "image/jpeg"|"image/png"|"image/webp" }
// Returns structured JSON ready to pre-fill the product form.

const OCR_PROMPT = `Analyze this cannabis product label or Certificate of Analysis (COA) image.
Extract all visible product information and return ONLY a valid JSON object with exactly these keys (use null for any value that is not visible or is unclear):

{
  "name": string or null,
  "brand": string or null,
  "strain_name": string or null,
  "cultivar_type": "indica" | "sativa" | "hybrid" | "cbd" | "unknown" | null,
  "thc_pct": number or null,
  "cbd_pct": number or null,
  "terpenes": [{"name": string, "pct": number or null}],
  "category": "flower" | "concentrate" | "edible" | "tincture" | "topical" | "vape" | "other" | null,
  "subcategory": "live_resin" | "live_rosin" | "rosin" | "wax" | "shatter" | "badder" | "sugar" | "diamonds" | "sauce" | "hash" | "distillate" | "rso" | "other" | null,
  "weight_g": number or null,
  "batch_number": string or null,
  "dispensary": string or null
}

Return ONLY the JSON object — no explanation, no markdown, no code fences.`

productsRouter.post('/ocr', asyncHandler(async (req, res) => {
  const { image, media_type } = req.body ?? {}

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ message: 'image (base64 string) is required.' })
  }

  const mt = media_type ?? 'image/jpeg'
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mt)) {
    return res.status(400).json({ message: `Unsupported image type: ${mt}` })
  }

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mt, data: image } },
        { type: 'text',  text: OCR_PROMPT },
      ],
    }],
  })

  const raw = response.content[0]?.text ?? ''

  let parsed
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()
    parsed = JSON.parse(cleaned)
  } catch {
    return res.status(422).json({
      message: 'Could not parse label data. Try a clearer or higher-resolution image.',
    })
  }

  res.json(parsed)
}))
