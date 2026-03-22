import { supabaseAdmin } from '../lib/supabase.js'

/**
 * requireAuth — extracts and verifies the Supabase JWT from the Authorization header.
 * Attaches req.user and req.accessToken on success.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Missing authorization token.' })
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }

  req.user = user
  req.accessToken = token
  next()
}
