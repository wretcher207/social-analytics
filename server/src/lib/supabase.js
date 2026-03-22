import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('[TERP] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
}

// Service-role client — bypasses RLS, server-side only
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

// Create a client scoped to a user's JWT (for RLS-enforced queries)
export function createUserClient(accessToken) {
  return createClient(url, process.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  })
}
