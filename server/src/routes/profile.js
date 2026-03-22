import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createUserClient, supabaseAdmin } from '../lib/supabase.js'
import { throwDbError } from '../lib/db.js'

export const profileRouter = Router()
profileRouter.use(requireAuth)

// ── GET /api/profile ──────────────────────────────────────────────────────────
// Returns the authenticated user's profile row + aggregate stats.

profileRouter.get('/', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)

  const [
    { data: profile },
    { data: journal },
    { data: products },
    { data: strainRows },
  ] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('display_name, avatar_url, timezone, created_at')
      .eq('id', req.user.id)
      .single(),
    db
      .from('journal_entries')
      .select('overall_rating, effects, strain_id'),
    db
      .from('products')
      .select('id'),
    db
      .from('journal_entries')
      .select('strain_id')
      .not('strain_id', 'is', null),
  ])

  // Aggregate stats
  const sessionCount  = journal?.length ?? 0
  const rated         = (journal ?? []).filter(e => e.overall_rating != null)
  const avgRating     = rated.length
    ? +(rated.reduce((s, e) => s + e.overall_rating, 0) / rated.length).toFixed(1)
    : null

  const strainCount   = new Set((strainRows ?? []).map(r => r.strain_id)).size

  // Top effects
  const effectFreq = {}
  ;(journal ?? []).forEach(e => {
    ;(e.effects ?? []).forEach(ef => { effectFreq[ef] = (effectFreq[ef] ?? 0) + 1 })
  })
  const topEffects = Object.entries(effectFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([e]) => e)

  res.json({
    id:           req.user.id,
    email:        req.user.email,
    display_name: profile?.display_name ?? null,
    avatar_url:   profile?.avatar_url   ?? null,
    timezone:     profile?.timezone     ?? null,
    member_since: profile?.created_at   ?? req.user.created_at,
    stats: {
      session_count: sessionCount,
      avg_rating:    avgRating,
      product_count: products?.length ?? 0,
      strain_count:  strainCount,
      top_effects:   topEffects,
    },
  })
}))

// ── PATCH /api/profile ────────────────────────────────────────────────────────
// Update display_name and/or timezone.

profileRouter.patch('/', asyncHandler(async (req, res) => {
  const { display_name, timezone } = req.body ?? {}

  const updates = { id: req.user.id, updated_at: new Date().toISOString() }
  if (display_name !== undefined) updates.display_name = display_name?.trim() || null
  if (timezone     !== undefined) updates.timezone     = timezone?.trim()     || null

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(updates, { onConflict: 'id' })
    .select()
    .single()

  if (error) throwDbError(error)

  res.json(data)
}))

// ── GET /api/profile/export ───────────────────────────────────────────────────
// Download all user data as JSON (journal entries + products).

profileRouter.get('/export', asyncHandler(async (req, res) => {
  const db = createUserClient(req.accessToken)

  const [
    { data: profile },
    { data: journal },
    { data: products },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', req.user.id).single(),
    db.from('journal_entries')
      .select('*, products(*, strains(*)), strains(*)')
      .order('session_at', { ascending: false }),
    db.from('products')
      .select('*, strains(*)')
      .order('created_at', { ascending: false }),
  ])

  res.json({
    exported_at:     new Date().toISOString(),
    user:            { id: req.user.id, email: req.user.email },
    profile:         profile ?? {},
    journal_entries: journal  ?? [],
    products:        products ?? [],
  })
}))
