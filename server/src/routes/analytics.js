import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createUserClient } from '../lib/supabase.js'
import { throwDbError } from '../lib/db.js'

export const analyticsRouter = Router()
analyticsRouter.use(requireAuth)

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateRange(req) {
  const { from, to } = req.query
  return { from: from ?? null, to: to ?? null }
}

function applyRange(query, col, from, to) {
  if (from) query = query.gte(col, from)
  if (to)   query = query.lte(col, to)
  return query
}

// ── /api/analytics/overview ───────────────────────────────────────────────────
analyticsRouter.get('/overview', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to } = dateRange(req)

  let jq = db.from('journal_entries')
    .select('overall_rating, session_at, products(thc_pct, cbd_pct)')
  let cq = db.from('consumption_logs')
    .select('started_at, method')

  jq = applyRange(jq, 'session_at', from, to)
  cq = applyRange(cq, 'started_at', from, to)

  const [jRes, cRes] = await Promise.all([jq, cq])
  if (jRes.error) throwDbError(jRes.error)
  if (cRes.error) throwDbError(cRes.error)

  const entries = jRes.data ?? []
  const logs    = cRes.data ?? []

  // Days active = unique dates across both sources
  const daySet = new Set()
  entries.forEach(e => { const d = e.session_at?.slice(0, 10); if (d) daySet.add(d) })
  logs.forEach(l => { const d = l.started_at?.slice(0, 10); if (d) daySet.add(d) })

  const rated = entries.filter(e => e.overall_rating != null)
  const avgRating = rated.length
    ? +(rated.reduce((s, e) => s + e.overall_rating, 0) / rated.length).toFixed(2)
    : null

  const withThc = entries.filter(e => e.products?.thc_pct != null)
  const withCbd = entries.filter(e => e.products?.cbd_pct != null)
  const avgThc = withThc.length
    ? +(withThc.reduce((s, e) => s + e.products.thc_pct, 0) / withThc.length).toFixed(1)
    : null
  const avgCbd = withCbd.length
    ? +(withCbd.reduce((s, e) => s + e.products.cbd_pct, 0) / withCbd.length).toFixed(1)
    : null

  res.json({
    totalEntries: entries.length,
    totalLogs:    logs.length,
    daysActive:   daySet.size,
    avgRating,
    avgThc,
    avgCbd,
  })
}))

// ── /api/analytics/heatmap ────────────────────────────────────────────────────
analyticsRouter.get('/heatmap', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to } = dateRange(req)

  let jq = db.from('journal_entries').select('session_at')
  let cq = db.from('consumption_logs').select('started_at')
  jq = applyRange(jq, 'session_at', from, to)
  cq = applyRange(cq, 'started_at', from, to)

  const [jRes, cRes] = await Promise.all([jq, cq])
  if (jRes.error) throwDbError(jRes.error)
  if (cRes.error) throwDbError(cRes.error)

  const counts = {}
  ;(jRes.data ?? []).forEach(e => {
    const d = e.session_at?.slice(0, 10)
    if (d) counts[d] = (counts[d] ?? 0) + 1
  })
  ;(cRes.data ?? []).forEach(l => {
    const d = l.started_at?.slice(0, 10)
    if (d) counts[d] = (counts[d] ?? 0) + 1
  })

  const data = Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  res.json(data)
}))

// ── /api/analytics/methods ────────────────────────────────────────────────────
analyticsRouter.get('/methods', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to } = dateRange(req)

  let jq = db.from('journal_entries').select('consumption_method')
  let cq = db.from('consumption_logs').select('method')
  jq = applyRange(jq, 'session_at', from, to)
  cq = applyRange(cq, 'started_at', from, to)

  const [jRes, cRes] = await Promise.all([jq, cq])
  if (jRes.error) throwDbError(jRes.error)
  if (cRes.error) throwDbError(cRes.error)

  const counts = {}
  ;(jRes.data ?? []).forEach(e => {
    const m = e.consumption_method
    if (m) counts[m] = (counts[m] ?? 0) + 1
  })
  ;(cRes.data ?? []).forEach(l => {
    const m = l.method
    if (m) counts[m] = (counts[m] ?? 0) + 1
  })

  const data = Object.entries(counts)
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count)

  res.json(data)
}))

// ── /api/analytics/by-hour ────────────────────────────────────────────────────
analyticsRouter.get('/by-hour', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to } = dateRange(req)

  let jq = db.from('journal_entries').select('session_at')
  let cq = db.from('consumption_logs').select('started_at')
  jq = applyRange(jq, 'session_at', from, to)
  cq = applyRange(cq, 'started_at', from, to)

  const [jRes, cRes] = await Promise.all([jq, cq])
  if (jRes.error) throwDbError(jRes.error)
  if (cRes.error) throwDbError(cRes.error)

  const counts = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
  ;(jRes.data ?? []).forEach(e => {
    if (e.session_at) counts[new Date(e.session_at).getHours()].count++
  })
  ;(cRes.data ?? []).forEach(l => {
    if (l.started_at) counts[new Date(l.started_at).getHours()].count++
  })

  res.json(counts)
}))

// ── /api/analytics/top-products ───────────────────────────────────────────────
analyticsRouter.get('/top-products', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to } = dateRange(req)
  const topN = Math.min(parseInt(req.query.limit ?? '8', 10), 20)

  let jq = db.from('journal_entries').select('product_id, products(id, name, category, brand)')
  let cq = db.from('consumption_logs').select('product_id, products(id, name, category, brand)')
  jq = applyRange(jq, 'session_at', from, to)
  cq = applyRange(cq, 'started_at', from, to)

  const [jRes, cRes] = await Promise.all([jq, cq])
  if (jRes.error) throwDbError(jRes.error)
  if (cRes.error) throwDbError(cRes.error)

  const map = {}
  function add(rows) {
    rows.forEach(r => {
      if (!r.product_id || !r.products) return
      if (!map[r.product_id]) map[r.product_id] = { product: r.products, count: 0 }
      map[r.product_id].count++
    })
  }
  add(jRes.data ?? [])
  add(cRes.data ?? [])

  const data = Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map(({ product, count }) => ({ ...product, count }))

  res.json(data)
}))

// ── /api/analytics/top-strains ────────────────────────────────────────────────
analyticsRouter.get('/top-strains', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to } = dateRange(req)
  const topN = Math.min(parseInt(req.query.limit ?? '8', 10), 20)

  let jq = db.from('journal_entries').select('strain_id, strains(id, name, cultivar_type)')
  jq = applyRange(jq, 'session_at', from, to)

  const { data, error } = await jq
  if (error) throwDbError(error)

  const map = {}
  ;(data ?? []).forEach(r => {
    if (!r.strain_id || !r.strains) return
    if (!map[r.strain_id]) map[r.strain_id] = { strain: r.strains, count: 0 }
    map[r.strain_id].count++
  })

  const result = Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map(({ strain, count }) => ({ ...strain, count }))

  res.json(result)
}))

// ── /api/analytics/ratings-trend ─────────────────────────────────────────────
analyticsRouter.get('/ratings-trend', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)
  const { from, to } = dateRange(req)
  const bucket = req.query.bucket === 'month' ? 'month' : 'week'

  let query = db.from('journal_entries')
    .select('session_at, overall_rating')
    .not('overall_rating', 'is', null)
    .order('session_at', { ascending: true })
  query = applyRange(query, 'session_at', from, to)

  const { data, error } = await query
  if (error) throwDbError(error)

  const groups = {}
  ;(data ?? []).forEach(e => {
    if (e.overall_rating == null || !e.session_at) return
    const d = new Date(e.session_at)
    let key
    if (bucket === 'month') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    } else {
      // ISO week number
      const startOfYear = new Date(d.getFullYear(), 0, 1)
      const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
      key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    }
    if (!groups[key]) groups[key] = { sum: 0, count: 0 }
    groups[key].sum += e.overall_rating
    groups[key].count++
  })

  const trend = Object.entries(groups)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([period, { sum, count }]) => ({
      period,
      avgRating: +(sum / count).toFixed(2),
      count,
    }))

  res.json(trend)
}))
