import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

import { healthRouter }     from './routes/health.js'
import { authRouter }        from './routes/auth.js'
import { strainsRouter }     from './routes/strains.js'
import { productsRouter }    from './routes/products.js'
import { journalRouter }     from './routes/journal.js'
import { consumptionRouter } from './routes/consumption.js'
import { aiRouter }          from './routes/ai.js'
import { analyticsRouter }   from './routes/analytics.js'
import { profileRouter }     from './routes/profile.js'
import { errorHandler }      from './middleware/errors.js'

const app = express()
const PORT = process.env.PORT ?? 4000

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json({ limit: '2mb' }))

app.use(rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests — slow down.' },
}))

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/health',           healthRouter)
app.use('/api/auth',         authRouter)
app.use('/api/strains',      strainsRouter)
app.use('/api/products',     productsRouter)
app.use('/api/journal',      journalRouter)
app.use('/api/consumption',  consumptionRouter)
app.use('/api/ai',           aiRouter)
app.use('/api/analytics',    analyticsRouter)
app.use('/api/profile',      profileRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found.' })
})

// Global error handler (must be last)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[TERP] API server listening on :${PORT}`)
})
