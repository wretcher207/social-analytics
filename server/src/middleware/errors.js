/**
 * Global error handler — last middleware in the chain.
 * Keeps error responses consistent and prevents stack trace leaks.
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status ?? err.statusCode ?? 500
  const message = status < 500 ? err.message : 'Internal server error.'

  if (status >= 500) {
    console.error(`[TERP] ${req.method} ${req.path} →`, err)
  }

  res.status(status).json({ message })
}

/**
 * Wrap an async route handler so errors are forwarded to errorHandler.
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}
