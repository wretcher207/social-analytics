/**
 * Builds the journal intake prompt.
 *
 * @param {object} opts
 * @param {string}  opts.body              Raw session notes from the user
 * @param {object}  [opts.product]         Product row (joined from DB)
 * @param {object}  [opts.strain]          Strain row (joined from DB)
 * @param {string}  [opts.method]          Consumption method
 * @param {string}  [opts.doseDescription] Freeform dose string
 */
export function buildIntakePrompt({ body, product, strain, method, doseDescription }) {
  const knownTerpenes =
    (strain?.terpenes ?? product?.terpenes ?? [])
      .map(t => `${t.name} (${t.pct}%)`)
      .join(', ') || 'unknown'

  const strainName  = strain?.name ?? product?.strains?.name ?? 'unspecified'
  const cultivar    = strain?.cultivar_type ?? product?.strains?.cultivar_type ?? 'unknown'
  const thc         = strain?.thc_pct ?? product?.thc_pct ?? null
  const cbd         = strain?.cbd_pct ?? product?.cbd_pct ?? null
  const productName = product?.name ?? null
  const category    = product?.category ?? null

  const contextLines = [
    productName  ? `Product: ${productName} (${category ?? 'flower'})` : null,
    strainName !== 'unspecified' ? `Strain: ${strainName} — ${cultivar}` : null,
    thc != null  ? `THC: ${thc}%` : null,
    cbd != null  ? `CBD: ${cbd}%` : null,
    knownTerpenes !== 'unknown' ? `Lab terpenes: ${knownTerpenes}` : null,
    method        ? `Consumption method: ${method}` : null,
    doseDescription ? `Dose: ${doseDescription}` : null,
  ].filter(Boolean).join('\n')

  return `You are TERP, an expert cannabis terpene intelligence system. Your role is to analyze session notes written by a cannabis user and extract structured data about the experience.

## Session context
${contextLines || 'No product context provided.'}

## User session notes
${body.trim()}

## Instructions

Analyze the notes carefully. Return ONLY a single JSON object — no markdown, no explanation, no wrapper text — with exactly these fields:

{
  "summary": "One or two sentences. Clinical, precise, non-judgmental. Describe the character and arc of the experience. Never use slang. Never mention cannabis, weed, etc. — refer to 'the product' or 'the session'.",
  "effects": ["array of observed positive effects — use only terms from this list: relaxed, euphoric, creative, focused, energetic, uplifted, happy, giggly, talkative, sociable, sleepy, sedated, body-heavy, couch-lock, pain relief, anti-anxiety, appetite, anti-nausea, clear-headed, meditative"],
  "negatives": ["array of adverse effects observed — use only: dry mouth, dry eyes, anxiety, paranoia, headache, dizziness, racing thoughts, fatigue, couch-lock, over-intoxicated"],
  "setting": "infer from context: home | outdoor | social | medical | work | transit | other",
  "terpene_reasoning": "2–3 sentences connecting any mentioned sensory characteristics (aroma, flavor, body feel, mental effects) to likely dominant terpenes. Be specific. If lab data was provided, reference it.",
  "inferred_terpenes": [
    { "name": "TerpeneName", "confidence": "high|medium|low", "rationale": "one sentence" }
  ],
  "suggested_ratings": {
    "mood_after":    null or 1-5 integer,
    "energy_after":  null or 1-5 integer,
    "anxiety_after": null or 1-5 integer,
    "pain_after":    null or 1-5 integer,
    "focus_after":   null or 1-5 integer,
    "overall_rating": null or 1-5 integer
  }
}

Rating scale: 1=very low/poor, 2=low/fair, 3=moderate/good, 4=high/very good, 5=very high/excellent.
For anxiety_after: 1=very anxious, 5=very calm. For pain_after: 1=severe pain, 5=no pain.
Only suggest a rating if the notes contain clear evidence for it. Null otherwise.`
}

/**
 * System prompt for the recommendation engine (Phase 6).
 */
export const RECOMMENDATION_SYSTEM_PROMPT = `You are TERP, a precision cannabis terpene intelligence system. You help users find products and sessions that match their desired therapeutic and experiential outcomes. You speak with the precision of a sommelier and the knowledge of a clinical researcher. You never recommend getting high or intoxicated — you focus on terpene profiles, entourage effects, and user history patterns.`
