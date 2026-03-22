import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Trash2, RefreshCw, Pencil } from 'lucide-react'
import { getEntry, deleteEntry } from '@/lib/journal'
import { processEntry } from '@/lib/ai'
import { Button } from '@/components/ui/Button'
import { EffectTag } from '@/components/journal/EffectTag'
import { RatingRow } from '@/components/journal/RatingRow'
import styles from './EntryDetailPage.module.css'

function formatDateLong(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const METHOD_LABELS = {
  flower: 'Flower', dab: 'Dab', vape: 'Vape',
  edible: 'Edible', tincture: 'Tincture', sublingual: 'Sublingual',
  topical: 'Topical', other: 'Other',
}

const DIMENSIONS = [
  { key: 'mood',    label: 'Mood' },
  { key: 'energy',  label: 'Energy' },
  { key: 'anxiety', label: 'Anxiety' },
  { key: 'pain',    label: 'Pain' },
  { key: 'focus',   label: 'Focus' },
]

export function EntryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [entry, setEntry]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    setLoading(true)
    getEntry(id)
      .then(setEntry)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleReprocess() {
    setAiLoading(true)
    try {
      const res = await processEntry(id)
      setEntry(res.entry)
    } catch (err) {
      setError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteEntry(id)
      navigate('/journal', { replace: true })
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <span className="label-caps">Loading</span>
      </div>
    )
  }

  if (error && !entry) {
    return (
      <div className={styles.center}>
        <p className={styles.errorMsg}>{error}</p>
        <Button variant="ghost" onClick={() => navigate('/journal')}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Back
        </Button>
      </div>
    )
  }

  const strain  = entry.strains
  const product = entry.products
  const terpProfile = entry.ai_terpene_profile

  const hasBefore = DIMENSIONS.some(d => entry[`${d.key}_before`] != null)
  const hasAfter  = DIMENSIONS.some(d => entry[`${d.key}_after`]  != null)

  return (
    <div className={styles.page}>
      {/* Top nav */}
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/journal')}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          Journal
        </button>
        <div className={styles.topActions}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/journal/${id}/edit`)}>
            <Pencil size={12} strokeWidth={1.5} />
            Edit
          </Button>
          {entry.body && (
            <Button
              variant="ghost"
              size="sm"
              loading={aiLoading}
              onClick={handleReprocess}
              title={entry.ai_processed ? 'Re-analyze with AI' : 'Analyze with AI'}
            >
              {entry.ai_processed ? (
                <><RefreshCw size={12} strokeWidth={1.5} /> Re-analyze</>
              ) : (
                <><Sparkles size={12} strokeWidth={1.5} /> Analyze</>
              )}
            </Button>
          )}
          {!showDelete ? (
            <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}>
              <Trash2 size={12} strokeWidth={1.5} />
            </Button>
          ) : (
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              Confirm delete
            </Button>
          )}
        </div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <time className={styles.date}>{formatDateLong(entry.session_at)}</time>
          <div className={styles.badges}>
            {entry.consumption_method && (
              <span className={styles.badge}>{METHOD_LABELS[entry.consumption_method] ?? entry.consumption_method}</span>
            )}
            {entry.dose_description && (
              <span className={styles.badge}>{entry.dose_description}</span>
            )}
            {entry.ai_processed && (
              <span className={[styles.badge, styles.badgeAI].join(' ')}>
                <Sparkles size={9} strokeWidth={1.5} /> AI analyzed
              </span>
            )}
          </div>
        </div>

        {entry.title && <h1 className={styles.title}>{entry.title}</h1>}

        {(product || strain) && (
          <p className={styles.product}>
            {product?.name ?? strain?.name}
            {(product?.brand || strain?.brand) && (
              <span> · {product?.brand ?? strain?.brand}</span>
            )}
            {product?.category && (
              <span className={styles.category}> {product.category}</span>
            )}
          </p>
        )}

        {entry.overall_rating && (
          <div className={styles.overallRating}>
            <span className={styles.overallNum}>{entry.overall_rating}</span>
            <span className={styles.overallOf}>/5</span>
            <span className={styles.overallLabel}>
              {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][entry.overall_rating]}
            </span>
          </div>
        )}
      </header>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {/* AI summary */}
      {entry.ai_summary && (
        <section className={styles.aiCard}>
          <div className={styles.aiCardHead}>
            <Sparkles size={12} strokeWidth={1.5} />
            <span className="label-caps">AI Summary</span>
          </div>
          <p className={styles.aiSummary}>{entry.ai_summary}</p>
          {terpProfile?.reasoning && (
            <p className={styles.aiTerpene}>{terpProfile.reasoning}</p>
          )}
          {terpProfile?.terpenes?.length > 0 && (
            <div className={styles.terpeneRow}>
              {terpProfile.terpenes.map(t => (
                <EffectTag
                  key={t.name}
                  label={`${t.name}${t.confidence ? ` · ${t.confidence}` : ''}`}
                  variant="terpene"
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Effects / negatives */}
      {(entry.effects?.length > 0 || entry.negatives?.length > 0) && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Effects</h3>
          <div className={styles.tagRow}>
            {entry.effects?.map(e => <EffectTag key={e} label={e} variant="effect" />)}
            {entry.negatives?.map(e => <EffectTag key={e} label={e} variant="negative" />)}
          </div>
        </section>
      )}

      {/* Ratings */}
      {(hasBefore || hasAfter) && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Ratings</h3>
          <div className={styles.ratingsGrid}>
            {DIMENSIONS.map(d => {
              const before = entry[`${d.key}_before`]
              const after  = entry[`${d.key}_after`]
              if (before == null && after == null) return null
              return (
                <div key={d.key} className={styles.ratingPair}>
                  {before != null && (
                    <RatingRow label={`${d.label} before`} value={before} readOnly />
                  )}
                  {after != null && (
                    <RatingRow label={`${d.label} after`} value={after} readOnly />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Raw notes */}
      {entry.body && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Session notes</h3>
          <p className={styles.body}>{entry.body}</p>
        </section>
      )}

      {/* Tags */}
      {entry.tags?.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Tags</h3>
          <div className={styles.tagRow}>
            {entry.tags.map(t => <EffectTag key={t} label={t} variant="tag-variant" />)}
          </div>
        </section>
      )}
    </div>
  )
}
