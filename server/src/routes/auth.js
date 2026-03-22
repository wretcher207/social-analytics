import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { supabaseAdmin } from '../lib/supabase.js'

export const authRouter = Router()

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile.
 */
authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({
    id:    req.user.id,
    email: req.user.email,
    role:  req.user.role,
    created_at: req.user.created_at,
  })
}))

/**
 * POST /api/auth/profile
 * Upsert a user profile row (username, display_name, etc.)
 * Phase 2 will extend this with the full profiles table.
 */
authRouter.post('/profile', requireAuth, asyncHandler(async (req, res) => {
  const { display_name } = req.body ?? {}

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: req.user.id, display_name }, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    const err = new Error(error.message)
    err.status = 400
    throw err
  }

  res.json(data)
}))
