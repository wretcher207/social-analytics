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

/**
 * Builds the personalized recommendation prompt from aggregated user history.
 *
 * @param {object} ctx
 * @param {Array}   ctx.entries        Recent journal entries (with products/strains expanded)
 * @param {Array}   ctx.topStrains     [{name, cultivar_type, count, avgRating, terpenes}]
 * @param {Array}   ctx.topProducts    [{name, category, thc_pct, cbd_pct, count, avgRating}]
 * @param {object}  ctx.effectFreq     {[effect]: count}
 * @param {object}  ctx.negativeFreq   {[negative]: count}
 * @param {string}  [ctx.goal]         Optional user-stated intent
 */
export function buildRecommendationPrompt({ entries, topStrains, topProducts, effectFreq, negativeFreq, goal }) {
  // Format recent entries (last 20, most recent first)
  const entryLines = entries.slice(0, 20).map((e, i) => {
    const product = e.products
    const strain  = e.strains ?? e.products?.strains
    const parts   = [
      `Entry ${i + 1} (${e.session_at?.slice(0, 10) ?? 'unknown date'})`,
      product  ? `  Product: ${product.name} [${product.category}]${product.thc_pct != null ? ` · THC ${product.thc_pct}%` : ''}${product.cbd_pct != null ? ` · CBD ${product.cbd_pct}%` : ''}` : null,
      strain   ? `  Strain: ${strain.name} (${strain.cultivar_type ?? 'unknown type'})` : null,
      product?.terpenes?.length ? `  Terpenes: ${product.terpenes.map(t => `${t.name}${t.pct != null ? ` ${t.pct}%` : ''}`).join(', ')}` : null,
      e.consumption_method ? `  Method: ${e.consumption_method}` : null,
      e.effects?.length    ? `  Effects: ${e.effects.join(', ')}` : null,
      e.negatives?.length  ? `  Negatives: ${e.negatives.join(', ')}` : null,
      e.overall_rating     ? `  Rating: ${e.overall_rating}/5` : null,
      e.mood_after    != null ? `  Mood after: ${e.mood_after}/5`    : null,
      e.energy_after  != null ? `  Energy after: ${e.energy_after}/5`  : null,
      e.anxiety_after != null ? `  Anxiety after: ${e.anxiety_after}/5` : null,
      e.pain_after    != null ? `  Pain after: ${e.pain_after}/5`    : null,
      e.focus_after   != null ? `  Focus after: ${e.focus_after}/5`   : null,
      e.ai_summary    ? `  Summary: ${e.ai_summary}` : null,
    ].filter(Boolean).join('\n')
    return parts
  }).join('\n\n')

  const strainLines = topStrains.length
    ? topStrains.map(s =>
        `- ${s.name} (${s.cultivar_type ?? 'unknown'}) · ${s.count} sessions${s.avgRating ? ` · avg ★${s.avgRating}` : ''}${s.terpenes?.length ? ` · terpenes: ${s.terpenes.map(t => t.name).join(', ')}` : ''}`
      ).join('\n')
    : '(no strain data yet)'

  const productLines = topProducts.length
    ? topProducts.map(p =>
        `- ${p.name} [${p.category}] · ${p.count} sessions${p.avgRating ? ` · avg ★${p.avgRating}` : ''}${p.thc_pct != null ? ` · THC ${p.thc_pct}%` : ''}`
      ).join('\n')
    : '(no product data yet)'

  const effectLines = Object.entries(effectFreq)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([e, n]) => `${e}: ${n}×`).join(', ') || 'none yet'

  const negativeLines = Object.entries(negativeFreq)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([n, c]) => `${n}: ${c}×`).join(', ') || 'none recorded'

  const goalBlock = goal?.trim()
    ? `\n## What the user is looking for\n${goal.trim()}\n`
    : ''

  return `Based on this user's complete session history, generate precise personalized terpene and product profile recommendations.

## Session history (${entries.length} entries, most recent first)
${entryLines || '(No entries yet)'}

## Most-used strains
${strainLines}

## Most-used products
${productLines}

## Effect frequency (most common positive outcomes)
${effectLines}

## Negative frequency (adverse patterns)
${negativeLines}
${goalBlock}
## Instructions

Study the history carefully. Identify patterns in:
- Which terpene profiles correlate with the user's highest-rated sessions
- Which cultivar types (indica/sativa/hybrid) the user responds well to
- Time-of-day patterns if discernible
- Any consistent adverse reactions that suggest sensitivities

Return ONLY a single JSON object — no markdown, no explanation — with exactly this shape:

{
  "insights": [
    {
      "title": "Short, specific observation title (5-8 words)",
      "body": "2-3 precise sentences. Reference specific sessions, strains, or terpenes by name. Be analytical, not generic.",
      "type": "pattern | preference | timing | caution"
    }
  ],
  "terpene_goals": [
    {
      "name": "TerpeneName (from the 12 canonical terpenes: Myrcene, Limonene, Caryophyllene, Linalool, Pinene, Humulene, Terpinolene, Ocimene, Bisabolol, Valencene, Geraniol, Camphene)",
      "reason": "One sentence tying this to something specific in the user's history",
      "effect_target": "3-4 word label e.g. 'evening wind-down' or 'creative morning'"
    }
  ],
  "profiles": [
    {
      "title": "Descriptive name for this profile (not a strain name)",
      "category": "flower | concentrate | edible | vape | tincture",
      "cultivar_type": "indica | sativa | hybrid | cbd",
      "terpenes": ["PrimaryTerpene", "SecondaryTerpene", "TertiaryTerpene"],
      "timing": "morning | afternoon | evening | night | anytime",
      "use_case": "One sentence: the specific outcome this profile serves",
      "why": "2 sentences directly referencing the user's history data — specific effects, ratings, or products they've enjoyed"
    }
  ],
  "avoid": [
    {
      "item": "Specific terpene, cultivar type, method, or characteristic to avoid",
      "reason": "One sentence backed by specific evidence from the session history"
    }
  ]
}

Constraints:
- insights: 2-4 items. Only include if genuinely supported by the data.
- terpene_goals: 3-5 items. Prioritize by correlation with top-rated sessions.
- profiles: 2-4 items. Make them meaningfully distinct from each other.
- avoid: 0-2 items. Only if there is clear negative evidence. Omit if data is insufficient.
- Never use generic filler. Every claim must be traceable to something in the history above.
- If the history is sparse (fewer than 5 entries), note this in insights and be more conservative.`
}
