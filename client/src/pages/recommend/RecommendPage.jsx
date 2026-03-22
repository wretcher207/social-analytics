import { useState } from 'react'
import { Sparkles, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import { getRecommendations } from '@/lib/ai'
import { Button } from '@/components/ui/Button'
import styles from './RecommendPage.module.css'

// ── Type badge colours ────────────────────────────────────────────────────────
const INSIGHT_COLORS = {
  pattern:    { bg: 'var(--color-accent-dim)',  border: 'rgba(200,169,110,0.25)', text: 'var(--color-accent)' },
  preference: { bg: 'var(--color-violet-dim)',  border: 'rgba(123,110,143,0.25)', text: 'var(--color-violet)' },
  timing:     { bg: 'rgba(110,143,110,0.08)',   border: 'rgba(110,143,110,0.2)', text: '#8aab8a' },
  caution:    { bg: 'var(--color-danger-dim)',  border: 'var(--color-danger)',    text: '#c87070' },
}

const TIMING_LABELS = {
  morning:   '☀ Morning', afternoon: '⛅ Afternoon',
  evening:   '🌆 Evening', night: '🌙 Night', anytime: '⏱ Anytime',
}

// ── Small sub-components ──────────────────────────────────────────────────────
function TerpenePill({ name }) {
  return <span className={styles.terpenePill}>{name}</span>
}

function InsightCard({ insight }) {
  const color = INSIGHT_COLORS[insight.type] ?? INSIGHT_COLORS.pattern
  return (
    <div
      className={styles.insightCard}
      style={{ background: color.bg, borderColor: color.border }}
    >
      <div className={styles.insightHeader}>
        <span className={styles.insightType} style={{ color: color.text }}>
          {insight.type}
        </span>
        <h4 className={styles.insightTitle}>{insight.title}</h4>
      </div>
      <p className={styles.insightBody}>{insight.body}</p>
    </div>
  )
}

function TerpeneGoalCard({ goal }) {
  return (
    <div className={styles.terpeneGoal}>
      <div className={styles.terpeneGoalTop}>
        <span className={styles.terpeneGoalName}>{goal.name}</span>
        <span className={styles.terpeneGoalTarget}>{goal.effect_target}</span>
      </div>
      <p className={styles.terpeneGoalReason}>{goal.reason}</p>
    </div>
  )
}

function ProfileCard({ profile }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileTop}>
        <div className={styles.profileBadges}>
          <span className={styles.profileCategory}>{profile.category}</span>
          {profile.cultivar_type && (
            <span className={styles.profileCultivar}>{profile.cultivar_type}</span>
          )}
          {profile.timing && (
            <span className={styles.profileTiming}>
              {TIMING_LABELS[profile.timing] ?? profile.timing}
            </span>
          )}
        </div>
      </div>

      <h3 className={styles.profileTitle}>{profile.title}</h3>
      <p className={styles.profileUseCase}>{profile.use_case}</p>

      <div className={styles.profileTerpenes}>
        {(profile.terpenes ?? []).map(t => <TerpenePill key={t} name={t} />)}
      </div>

      <button
        type="button"
        className={styles.profileExpand}
        onClick={() => setExpanded(v => !v)}
      >
        {expanded ? 'Hide reasoning' : 'Why this profile?'}
      </button>

      {expanded && (
        <p className={styles.profileWhy}>{profile.why}</p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function RecommendPage() {
  const [goal, setGoal]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [result, setResult]     = useState(null)

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const data = await getRecommendations(goal.trim() ? { goal } : {})
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const hasResult = result && !loading

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>For You</h1>
          <p className={styles.sub}>
            {result
              ? <>Based on <span className="mono">{result.session_count}</span> sessions</>
              : 'Personalized terpene intelligence from your session history'}
          </p>
        </div>
        {hasResult && (
          <div className={styles.headerRight}>
            <span className={styles.genAt}>
              <Clock size={10} strokeWidth={1.5} />
              {new Date(result.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Button variant="ghost" size="sm" loading={loading} onClick={generate}>
              <RefreshCw size={12} strokeWidth={1.5} />
              Refresh
            </Button>
          </div>
        )}
      </header>

      {/* Goal input */}
      <div className={styles.goalRow}>
        <div className={styles.goalInputWrap}>
          <label className={styles.goalLabel}>
            What are you looking for?
            <span className={styles.goalOptional}> (optional)</span>
          </label>
          <input
            className={styles.goalInput}
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="e.g. better sleep, creative focus during work, pain relief without sedation…"
            disabled={loading}
          />
        </div>
        {!hasResult && (
          <Button
            onClick={generate}
            loading={loading}
            size="lg"
            disabled={loading}
          >
            <Sparkles size={14} strokeWidth={1.5} />
            {loading ? 'Analyzing…' : 'Generate insights'}
          </Button>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          <AlertTriangle size={14} strokeWidth={1.5} />
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className={styles.skeletonWrap}>
          <p className={styles.skeletonMsg}>
            <Sparkles size={12} strokeWidth={1.5} />
            Analyzing your session history…
          </p>
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {hasResult && (
        <>
          {/* Insights */}
          {result.insights.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Observations</h2>
              <div className={styles.insightGrid}>
                {result.insights.map((ins, i) => (
                  <InsightCard key={i} insight={ins} />
                ))}
              </div>
            </section>
          )}

          {/* Terpene goals */}
          {result.terpene_goals.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Terpenes to seek</h2>
              <div className={styles.terpeneGoalGrid}>
                {result.terpene_goals.map((g, i) => (
                  <TerpeneGoalCard key={i} goal={g} />
                ))}
              </div>
            </section>
          )}

          {/* Recommended profiles */}
          {result.profiles.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Profiles to try</h2>
              <div className={styles.profileGrid}>
                {result.profiles.map((p, i) => (
                  <ProfileCard key={i} profile={p} />
                ))}
              </div>
            </section>
          )}

          {/* Avoid */}
          {result.avoid.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Worth noting</h2>
              <div className={styles.avoidList}>
                {result.avoid.map((a, i) => (
                  <div key={i} className={styles.avoidItem}>
                    <AlertTriangle size={12} strokeWidth={1.5} className={styles.avoidIcon} />
                    <div>
                      <span className={styles.avoidItemName}>{a.item}</span>
                      <span className={styles.avoidItemReason}> — {a.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Re-generate with updated goal */}
          <div className={styles.regenRow}>
            <Button onClick={generate} loading={loading} variant="ghost">
              <RefreshCw size={12} strokeWidth={1.5} />
              Re-generate{goal.trim() ? ' with goal' : ''}
            </Button>
          </div>
        </>
      )}

      {/* Welcome state */}
      {!hasResult && !loading && !error && (
        <div className={styles.welcome}>
          <div className={styles.welcomeIcon}>
            <Sparkles size={24} strokeWidth={1} />
          </div>
          <h3 className={styles.welcomeTitle}>Precision recommendations from your history</h3>
          <ul className={styles.welcomeList}>
            <li>Pattern recognition across all your rated sessions</li>
            <li>Terpene profiles correlated to your best outcomes</li>
            <li>Strain type and timing recommendations</li>
            <li>Adverse reaction patterns to avoid</li>
          </ul>
          <p className={styles.welcomeNote}>
            Requires at least one journal entry. More data → better insights.
          </p>
        </div>
      )}
    </div>
  )
}
