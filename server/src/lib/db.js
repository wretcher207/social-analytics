/**
 * Shared query helpers that enforce user scoping.
 * All functions accept a Supabase client already scoped to the user's JWT.
 */

/**
 * Paginate a query result.
 * @param {number} page  1-based
 * @param {number} limit max 100
 */
export function paginate(page = 1, limit = 20) {
  const safeLimit = Math.min(Number(limit) || 20, 100)
  const safePage  = Math.max(Number(page) || 1, 1)
  const from = (safePage - 1) * safeLimit
  const to   = from + safeLimit - 1
  return { from, to, limit: safeLimit, page: safePage }
}

/**
 * Parse and validate a UUID path param.
 * Throws a 400-status error if invalid.
 */
export function parseUUID(value, name = 'id') {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(value)) {
    const err = new Error(`Invalid ${name}.`)
    err.status = 400
    throw err
  }
  return value
}

/**
 * Throw a standardised Supabase error as an HTTP error.
 */
export function throwDbError(error) {
  const err = new Error(error.message)
  err.status = error.code === '23505' ? 409 : 400
  throw err
}
