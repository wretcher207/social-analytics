import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { getEntry, updateEntry } from '@/lib/journal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EffectTag } from '@/components/journal/EffectTag'
import { RatingRow } from '@/components/journal/RatingRow'
import { CONSUMPTION_METHODS, EFFECT_TAGS, NEGATIVE_TAGS } from '@/lib/constants'
import styles from './EditEntryPage.module.css'

function toLocalDatetimeStr(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditEntryPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading]   = useState(true)
  const [loadErr, setLoadErr]   = useState('')
  const [saving,  setSaving]    = useState(false)
  const [saveErr, setSaveErr]   = useState('')

  // Form state — initialised once entry loads
  const [title,       setTitle]       = useState('')
  const [body,        setBody]        = useState('')
  const [method,      setMethod]      = useState('flower')
  const [doseDesc,    setDoseDesc]    = useState('')
  const [sessionAt,   setSessionAt]   = useState('')
  const [effects,     setEffects]     = useState([])
  const [negatives,   setNegatives]   = useState([])
  const [userTags,    setUserTags]    = useState([])
  const [tagInput,    setTagInput]    = useState('')
  const [moodBefore,    setMoodBefore]    = useState(null)
  const [energyBefore,  setEnergyBefore]  = useState(null)
  const [anxietyBefore, setAnxietyBefore] = useState(null)
  const [painBefore,    setPainBefore]    = useState(null)
  const [moodAfter,     setMoodAfter]     = useState(null)
  const [energyAfter,   setEnergyAfter]   = useState(null)
  const [anxietyAfter,  setAnxietyAfter]  = useState(null)
  const [painAfter,     setPainAfter]     = useState(null)
  const [focusAfter,    setFocusAfter]    = useState(null)
  const [overallRating, setOverallRating] = useState(null)

  // Load entry and hydrate form
  useEffect(() => {
    setLoading(true)
    getEntry(id)
      .then(e => {
        setTitle(e.title ?? '')
        setBody(e.body ?? '')
        setMethod(e.consumption_method ?? 'flower')
        setDoseDesc(e.dose_description ?? '')
        setSessionAt(toLocalDatetimeStr(e.session_at))
        setEffects(e.effects ?? [])
        setNegatives(e.negatives ?? [])
        setUserTags(e.tags ?? [])
        setMoodBefore(e.mood_before ?? null)
        setEnergyBefore(e.energy_before ?? null)
        setAnxietyBefore(e.anxiety_before ?? null)
        setPainBefore(e.pain_before ?? null)
        setMoodAfter(e.mood_after ?? null)
        setEnergyAfter(e.energy_after ?? null)
        setAnxietyAfter(e.anxiety_after ?? null)
        setPainAfter(e.pain_after ?? null)
        setFocusAfter(e.focus_after ?? null)
        setOverallRating(e.overall_rating ?? null)
      })
      .catch(err => setLoadErr(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Tag chip helpers
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
    setEffects(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }
  function toggleNegative(tag) {
    setNegatives(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveErr('')
    try {
      await updateEntry(id, {
        title:              title || undefined,
        body:               body  || undefined,
        consumption_method: method || undefined,
        dose_description:   doseDesc || undefined,
        session_at:         sessionAt ? new Date(sessionAt).toISOString() : undefined,
        effects,
        negatives,
        tags: userTags,
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
      })
      navigate(`/journal/${id}`)
    } catch (err) {
      setSaveErr(err.message)
    } finally {
      setSaving(false)
    }
  }, [id, title, body, method, doseDesc, sessionAt, effects, negatives, userTags,
      moodBefore, energyBefore, anxietyBefore, painBefore,
      moodAfter, energyAfter, anxietyAfter, painAfter, focusAfter, overallRating, navigate])

  if (loading) {
    return (
      <div className={styles.center}>
        <span className="label-caps">Loading entry…</span>
      </div>
    )
  }

  if (loadErr) {
    return (
      <div className={styles.center}>
        <p className={styles.errorMsg}>{loadErr}</p>
        <Button variant="ghost" onClick={() => navigate('/journal')}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Journal
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Top nav */}
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate(`/journal/${id}`)}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          Back to entry
        </button>
        <Button onClick={handleSave} loading={saving} size="md">
          <Check size={14} strokeWidth={2} />
          Save changes
        </Button>
      </div>

      <h1 className={styles.pageTitle}>Edit entry</h1>

      {saveErr && <p className={styles.errorMsg}>{saveErr}</p>}

      {/* ── Session metadata ───────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Session</h2>

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
      </section>

      {/* ── Notes ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notes</h2>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Title <span className={styles.opt}>(optional)</span></label>
          <input
            className={styles.textInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Evening — strong onset, creative"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Session notes</label>
          <textarea
            className={styles.textarea}
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={8}
          />
        </div>
      </section>

      {/* ── Effects ───────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Effects observed</h2>
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
      </section>

      {/* ── Adverse effects ───────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Adverse effects <span className={styles.opt}>(if any)</span></h2>
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
      </section>

      {/* ── User tags ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your tags <span className={styles.opt}>(Enter or comma to add)</span></h2>
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
      </section>

      {/* ── Before ratings ────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Before session <span className={styles.opt}>(optional)</span></h2>
        <div className={styles.ratingsGrid}>
          <RatingRow label="Mood"    value={moodBefore}    onChange={setMoodBefore} />
          <RatingRow label="Energy"  value={energyBefore}  onChange={setEnergyBefore} />
          <RatingRow label="Anxiety" value={anxietyBefore} onChange={setAnxietyBefore} />
          <RatingRow label="Pain"    value={painBefore}    onChange={setPainBefore} />
        </div>
      </section>

      {/* ── After ratings ─────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>After session</h2>
        <div className={styles.ratingsGrid}>
          <RatingRow label="Mood"    value={moodAfter}    onChange={setMoodAfter} />
          <RatingRow label="Energy"  value={energyAfter}  onChange={setEnergyAfter} />
          <RatingRow label="Anxiety" value={anxietyAfter} onChange={setAnxietyAfter} />
          <RatingRow label="Pain"    value={painAfter}    onChange={setPainAfter} />
          <RatingRow label="Focus"   value={focusAfter}   onChange={setFocusAfter} />
        </div>
      </section>

      {/* ── Overall rating ────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Overall rating</h2>
        <div className={styles.overallRow}>
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
          {overallRating && (
            <span className={styles.overallLabel}>
              {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][overallRating]}
            </span>
          )}
        </div>
      </section>

      {/* Bottom save */}
      <div className={styles.bottomSave}>
        {saveErr && <p className={styles.errorMsg}>{saveErr}</p>}
        <Button onClick={handleSave} loading={saving} size="lg">
          <Check size={14} strokeWidth={2} />
          Save changes
        </Button>
      </div>
    </div>
  )
}
