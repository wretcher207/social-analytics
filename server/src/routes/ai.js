import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errors.js'
import { createUserClient, supabaseAdmin } from '../lib/supabase.js'
import { parseUUID, throwDbError } from '../lib/db.js'
import { anthropic, AI_MODEL } from '../lib/anthropic.js'
import { buildIntakePrompt } from '../lib/prompts.js'

export const aiRouter = Router()
aiRouter.use(requireAuth)

// ── POST /api/ai/intake ───────────────────────────────────────────────────────
// Analyze freeform notes. Returns structured AI data — does NOT save to DB.
// Frontend submits this alongside the full entry creation (POST /api/journal).

aiRouter.post('/intake', asyncHandler(async (req, res) => {
  const { body, product_id, strain_id, consumption_method, dose_description } = req.body ?? {}

  if (!body?.trim()) {
    return res.status(400).json({ message: 'body (session notes) is required.' })
  }
  if (body.trim().length < 20) {
    return res.status(400).json({ message: 'Notes are too short for meaningful analysis. Write at least a sentence.' })
  }

  // Fetch product/strain context if provided
  const db = createUserClient(req.accessToken)
  let product = null
  let strain  = null

  if (product_id) {
    const { data } = await db
      .from('products')
      .select('*, strains(*)')
      .eq('id', parseUUID(product_id))
      .single()
    product = data
    strain  = data?.strains ?? null
  } else if (strain_id) {
    const { data } = await db
      .from('strains')
      .select('*')
      .eq('id', parseUUID(strain_id))
      .single()
    strain = data
  }

  const prompt = buildIntakePrompt({
    body,
    product,
    strain,
    method: consumption_method,
    doseDescription: dose_description,
  })

  const message = await anthropic.messages.create({
    model:      AI_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0]?.text ?? ''

  let parsed
  try {
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('[TERP/ai] Failed to parse Claude response:', raw)
    return res.status(502).json({ message: 'AI returned an unexpected format. Try again.' })
  }

  res.json({
    summary:            parsed.summary            ?? null,
    effects:            Array.isArray(parsed.effects)           ? parsed.effects           : [],
    negatives:          Array.isArray(parsed.negatives)         ? parsed.negatives         : [],
    setting:            parsed.setting            ?? null,
    terpene_reasoning:  parsed.terpene_reasoning  ?? null,
    inferred_terpenes:  Array.isArray(parsed.inferred_terpenes) ? parsed.inferred_terpenes : [],
    suggested_ratings:  parsed.suggested_ratings  ?? {},
  })
}))

// ── POST /api/ai/process/:entryId ─────────────────────────────────────────────
// Re-run AI on an existing journal entry (retroactive processing or re-analysis).

aiRouter.post('/process/:entryId', asyncHandler(async (req, res) => {
  const entryId = parseUUID(req.params.entryId)
  const db = createUserClient(req.accessToken)

  // Fetch the entry (RLS ensures it belongs to this user)
  const { data: entry, error: entryErr } = await db
    .from('journal_entries')
    .select('*, products(*, strains(*)), strains(*)')
    .eq('id', entryId)
    .single()

  if (entryErr || !entry) {
    return res.status(404).json({ message: 'Entry not found.' })
  }
  if (!entry.body?.trim()) {
    return res.status(400).json({ message: 'Entry has no notes to analyze.' })
  }

  const prompt = buildIntakePrompt({
    body:            entry.body,
    product:         entry.products  ?? null,
    strain:          entry.strains   ?? entry.products?.strains ?? null,
    method:          entry.consumption_method,
    doseDescription: entry.dose_description,
  })

  const message = await anthropic.messages.create({
    model:      AI_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0]?.text ?? ''
  let parsed
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    return res.status(502).json({ message: 'AI returned an unexpected format. Try again.' })
  }

  // Persist AI results back to the entry using the admin client (bypasses
  // the user-scoped RLS update which would be fine, but admin is cleaner here
  // since we've already validated ownership via RLS on the select above)
  const aiUpdates = {
    ai_summary:           parsed.summary           ?? null,
    ai_terpene_profile:   {
      reasoning:  parsed.terpene_reasoning  ?? null,
      terpenes:   parsed.inferred_terpenes  ?? [],
    },
    ai_effects_inferred:  parsed.effects ?? [],
    ai_processed:         true,
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('journal_entries')
    .update(aiUpdates)
    .eq('id', entryId)
    .select()
    .single()

  if (updateErr) throwDbError(updateErr)

  res.json({
    entry:   updated,
    ai: {
      summary:           parsed.summary           ?? null,
      effects:           parsed.effects           ?? [],
      negatives:         parsed.negatives         ?? [],
      setting:           parsed.setting           ?? null,
      terpene_reasoning: parsed.terpene_reasoning ?? null,
      inferred_terpenes: parsed.inferred_terpenes ?? [],
      suggested_ratings: parsed.suggested_ratings ?? {},
    },
  })
}))
