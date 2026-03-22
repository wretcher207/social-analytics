import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react'
import { listProducts } from '@/lib/products'
import { listStrains } from '@/lib/strains'
import { analyzeNotes } from '@/lib/ai'
import { createEntry } from '@/lib/journal'
import { createLog } from '@/lib/consumption'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EffectTag } from '@/components/journal/EffectTag'
import { RatingRow } from '@/components/journal/RatingRow'
import { CONSUMPTION_METHODS, EFFECT_TAGS, NEGATIVE_TAGS } from '@/lib/constants'
import styles from './NewEntryPage.module.css'

// ── Step indicators ───────────────────────────────────────────────────────────
const STEPS = ['Context', 'Notes', 'Review & Save']

// ── Helper: format product/strain label ──────────────────────────────────────
function itemLabel(item, type) {
  if (type === 'product') {
    return `${item.name}${item.brand ? ` · ${item.brand}` : ''}`
  }
  return `${item.name}${item.cultivar_type ? ` (${item.cultivar_type})` : ''}`
}

export function NewEntryPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(0)

  // Step 1 — context
  const [products, setProducts]       = useState([])
  const [strains, setStrains]         = useState([])
  const [productId, setProductId]     = useState('')
  const [strainId, setStrainId]       = useState('')
  const [method, setMethod]           = useState('flower')
  const [doseDesc, setDoseDesc]       = useState('')
  const [sessionAt, setSessionAt]     = useState(() => toLocalDatetimeStr(new Date()))

  // Step 2 — notes
  const [title, setTitle]             = useState('')
  const [body, setBody]               = useState('')
  const [moodBefore, setMoodBefore]   = useState(null)
  const [energyBefore, setEnergyBefore] = useState(null)
  const [anxietyBefore, setAnxietyBefore] = useState(null)
  const [painBefore, setPainBefore]   = useState(null)

  // Step 3 — AI result + user edits
  const [aiLoading, setAiLoading]     = useState(false)
  const [aiError, setAiError]         = useState('')
  const [aiResult, setAiResult]       = useState(null)
  const [effects, setEffects]         = useState([])
  const [negatives, setNegatives]     = useState([])
  const [moodAfter, setMoodAfter]     = useState(null)
  const [energyAfter, setEnergyAfter] = useState(null)
  const [anxietyAfter, setAnxietyAfter] = useState(null)
  const [painAfter, setPainAfter]     = useState(null)
  const [focusAfter, setFocusAfter]   = useState(null)
  const [overallRating, setOverallRating] = useState(null)
  const [userTags, setUserTags]       = useState([])
  const [tagInput, setTagInput]       = useState('')
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState('')

  // Load products and strains for step 1 pickers
  useEffect(() => {
    listProducts({ limit: 100 }).then(r => setProducts(r.data ?? [])).catch(() => {})
    listStrains({ limit: 100 }).then(r => setStrains(r.data ?? [])).catch(() => {})
  }, [])

  // ── Step navigation ─────────────────────────────────────────────────────────

  async function goToStep2() {
    setStep(1)
  }

  async function runAIAnalysis() {
    if (!body.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await analyzeNotes({
        body,
        product_id: productId || undefined,
        strain_id:  !productId && strainId ? strainId : undefined,
        consumption_method: method || undefined,
        dose_description:   doseDesc || undefined,
      })
      setAiResult(res)
      setEffects(res.effects ?? [])
      setNegatives(res.negatives ?? [])
      const r = res.suggested_ratings ?? {}
      if (r.mood_after    != null) setMoodAfter(r.mood_after)
      if (r.energy_after  != null) setEnergyAfter(r.energy_after)
      if (r.anxiety_after != null) setAnxietyAfter(r.anxiety_after)
      if (r.pain_after    != null) setPainAfter(r.pain_after)
      if (r.focus_after   != null) setFocusAfter(r.focus_after)
      if (r.overall_rating != null) setOverallRating(r.overall_rating)
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
    setStep(2)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const entry = await createEntry({
        product_id:    productId || undefined,
        strain_id:     !productId && strainId ? strainId : undefined,
        title:         title || undefined,
        body:          body || undefined,
        consumption_method: method || undefined,
        dose_description:   doseDesc || undefined,
        session_at:    new Date(sessionAt).toISOString(),
        effects,
        negatives,
        mood_before:    moodBefore,
        energy_before:  energyBefore,
        anxiety_before: anxietyBefore,
        pain_before:    painBefore,
        mood_after:     moodAfter,
        energy_after:   energyAfter,
        anxiety_after:  anxietyAfter,
        pain_after:     painAfter,
        focus_after:    focusAfter,
        overall_rating: overallRating,
        tags:           userTags,
        // Persist AI results
        ai_summary:         aiResult?.summary            ?? undefined,
        ai_terpene_profile: aiResult ? {
          reasoning: aiResult.terpene_reasoning,
          terpenes:  aiResult.inferred_terpenes,
        } : undefined,
        ai_effects_inferred: aiResult?.effects ?? undefined,
        ai_processed:        !!aiResult,
      })

      // Also create a lightweight consumption log
      if (method) {
        await createLog({
          product_id:         productId || undefined,
          journal_entry_id:   entry.id,
          method,
          dose_description:   doseDesc || undefined,
          started_at:         new Date(sessionAt).toISOString(),
        }).catch(() => {}) // Non-critical
      }

      navigate(`/journal/${entry.id}`)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Effect tag helpers ──────────────────────────────────────────────────────
  function addUserTag(raw) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 24)
    if (!t || userTags.includes(t) || userTags.length >= 10) return
    setUserTags(prev => [...prev, t])
    setTagInput('')
  }
  function removeUserTag(t) { setUserTags(prev => prev.filter(x => x !== t)) }
  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addUserTag(tagInput) }
    if (e.key === 'Backspace' && !tagInput && userTags.length) {
      setUserTags(prev => prev.slice(0, -1))
    }
  }

  function toggleEffect(tag) {
    setEffects(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }
  function toggleNegative(tag) {
    setNegatives(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/journal')}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          Journal
        </button>
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={s} className={[styles.stepDot, i === step ? styles.stepActive : i < step ? styles.stepDone : ''].join(' ')}>
              <span>{i < step ? <Check size={10} strokeWidth={2.5} /> : i + 1}</span>
              <span className={styles.stepLabel}>{s}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ── STEP 1 — CONTEXT ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>What are you working with?</h2>

          {/* Product picker */}
          {products.length > 0 && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Product</label>
              <select
                className={styles.select}
                value={productId}
                onChange={e => { setProductId(e.target.value); setStrainId('') }}
              >
                <option value="">— Select a product —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{itemLabel(p, 'product')}</option>
                ))}
              </select>
            </div>
          )}

          {/* Strain picker (if no product selected) */}
          {!productId && strains.length > 0 && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Strain {products.length > 0 && <span className={styles.fieldOr}>(or pick above)</span>}</label>
              <select
                className={styles.select}
                value={strainId}
                onChange={e => setStrainId(e.target.value)}
              >
                <option value="">— Select a strain —</option>
                {strains.map(s => (
                  <option key={s.id} value={s.id}>{itemLabel(s, 'strain')}</option>
                ))}
              </select>
            </div>
          )}

          {/* Method segmented */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Consumption method</label>
            <div className={styles.methodGrid}>
              {CONSUMPTION_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  className={[styles.methodBtn, method === m.value ? styles.methodActive : ''].join(' ')}
                  onClick={() => setMethod(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row2}>
            <Input
              label="Dose"
              value={doseDesc}
              onChange={e => setDoseDesc(e.target.value)}
              placeholder="e.g. one small dab, 10mg gummy"
            />
            <Input
              label="Session time"
              type="datetime-local"
              value={sessionAt}
              onChange={e => setSessionAt(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <Button onClick={goToStep2} size="lg">
              Continue
              <ArrowRight size={14} strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2 — NOTES ───────────────────────────────────────────────── */}
      {step === 1 && (
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>Describe the session</h2>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Title <span className={styles.fieldOr}>(optional)</span></label>
            <input
              className={styles.textInput}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Evening — strong onset, creative"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Session notes
              <span className={styles.fieldOr}> — write freely, AI will extract the structure</span>
            </label>
            <textarea
              className={styles.textarea}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Describe the aroma, taste, onset, peak, duration, how you felt, what you noticed..."
              rows={8}
            />
            <span className={styles.charCount}>{body.length} chars</span>
          </div>

          <div className={styles.beforeRatings}>
            <p className={styles.ratingsLabel}>Before this session — <span className={styles.fieldOr}>optional</span></p>
            <div className={styles.ratingsGrid}>
              <RatingRow label="Mood"    value={moodBefore}    onChange={setMoodBefore} />
              <RatingRow label="Energy"  value={energyBefore}  onChange={setEnergyBefore} />
              <RatingRow label="Anxiety" value={anxietyBefore} onChange={setAnxietyBefore} />
              <RatingRow label="Pain"    value={painBefore}    onChange={setPainBefore} />
            </div>
          </div>

          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => setStep(0)} size="md">
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back
            </Button>
            <Button
              onClick={runAIAnalysis}
              loading={aiLoading}
              disabled={body.trim().length < 20}
              size="lg"
            >
              <Sparkles size={14} strokeWidth={1.5} />
              Analyze with AI
            </Button>
          </div>

          {body.trim().length > 0 && body.trim().length < 20 && (
            <p className={styles.hint}>Write a bit more — at least 20 characters for AI analysis.</p>
          )}
        </div>
      )}

      {/* ── STEP 3 — REVIEW ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className={styles.stepBody}>
          <h2 className={styles.stepTitle}>Review and save</h2>

          {aiError && <p className={styles.errorMsg}>{aiError}</p>}

          {aiResult && (
            <div className={styles.aiCard}>
              <div className={styles.aiCardHeader}>
                <Sparkles size={13} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
                <span className="label-caps">AI analysis</span>
              </div>

              {aiResult.summary && (
                <p className={styles.aiSummary}>{aiResult.summary}</p>
              )}

              {aiResult.terpene_reasoning && (
                <p className={styles.aiTerpene}>{aiResult.terpene_reasoning}</p>
              )}

              {aiResult.inferred_terpenes?.length > 0 && (
                <div className={styles.terpeneRow}>
                  {aiResult.inferred_terpenes.map(t => (
                    <EffectTag key={t.name} label={t.name} variant="terpene" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Effects */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Effects observed</label>
            <div className={styles.tagGrid}>
              {EFFECT_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={[styles.tagBtn, effects.includes(tag) ? styles.tagBtnActive : ''].join(' ')}
                  onClick={() => toggleEffect(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Negatives */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Adverse effects <span className={styles.fieldOr}>(if any)</span></label>
            <div className={styles.tagGrid}>
              {NEGATIVE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={[styles.tagBtn, styles.tagBtnNeg, negatives.includes(tag) ? styles.tagBtnNegActive : ''].join(' ')}
                  onClick={() => toggleNegative(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* User-defined tags */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Your tags <span className={styles.fieldOr}>(optional — Enter or comma to add)</span>
            </label>
            <div className={styles.tagChipInput}>
              {userTags.map(t => (
                <span key={t} className={styles.tagChip}>
                  {t}
                  <button type="button" className={styles.tagChipRemove} onClick={() => removeUserTag(t)}>×</button>
                </span>
              ))}
              {userTags.length < 10 && (
                <input
                  className={styles.tagTextInput}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => tagInput && addUserTag(tagInput)}
                  placeholder={userTags.length === 0 ? 'e.g. sleep, creative, evening…' : ''}
                />
              )}
            </div>
          </div>

          {/* After ratings */}
          <div className={styles.afterRatings}>
            <p className={styles.ratingsLabel}>After this session</p>
            <div className={styles.ratingsGrid}>
              <RatingRow label="Mood"    value={moodAfter}    onChange={setMoodAfter} />
              <RatingRow label="Energy"  value={energyAfter}  onChange={setEnergyAfter} />
              <RatingRow label="Anxiety" value={anxietyAfter} onChange={setAnxietyAfter} />
              <RatingRow label="Pain"    value={painAfter}    onChange={setPainAfter} />
              <RatingRow label="Focus"   value={focusAfter}   onChange={setFocusAfter} />
            </div>
          </div>

          {/* Overall */}
          <div className={styles.overallRow}>
            <span className={styles.fieldLabel}>Overall rating</span>
            <div className={styles.overallPips}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  type="button"
                  className={[styles.overallPip, overallRating != null && n <= overallRating ? styles.overallPipFilled : ''].join(' ')}
                  onClick={() => setOverallRating(overallRating === n ? null : n)}
                >
                  {n}
                </button>
              ))}
            </div>
            {overallRating && <span className={styles.overallLabel}>
              {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][overallRating]}
            </span>}
          </div>

          {saveError && <p className={styles.errorMsg}>{saveError}</p>}

          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => setStep(1)} size="md">
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back
            </Button>
            <Button onClick={handleSave} loading={saving} size="lg">
              <Check size={14} strokeWidth={2} />
              Save entry
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function toLocalDatetimeStr(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
