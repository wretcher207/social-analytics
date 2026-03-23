import { useEffect, useState, useMemo } from 'react'
import { listEntries } from '@/lib/journal'
import { listLogs } from '@/lib/consumption'
import { listProducts } from '@/lib/products'
import { listStrains } from '@/lib/strains'
import styles from './AchievementsPage.module.css'

// ── Streak helpers ────────────────────────────────────────────────────────────

function toDay(isoStr) {
  return isoStr?.slice(0, 10) ?? null
}

function computeStreaks(dates) {
  const days = [...new Set(dates.filter(Boolean))].sort()
  if (!days.length) return { current: 0, longest: 0 }

  let longest = 1, run = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = (curr - prev) / 86400000
    if (diff === 1) { run++; longest = Math.max(longest, run) }
    else run = 1
  }

  // Current streak — count back from today
  const today = new Date().toISOString().slice(0, 10)
  const daySet = new Set(days)
  let cur = 0
  const d = new Date(today)
  while (daySet.has(d.toISOString().slice(0, 10))) {
    cur++
    d.setDate(d.getDate() - 1)
  }

  return { current: cur, longest }
}

// ── Achievement definitions ───────────────────────────────────────────────────

const TIER = { bronze: 'bronze', silver: 'silver', gold: 'gold' }

function defineAchievements(data) {
  const { entries, logs, products, strains } = data
  const totalSessions = entries.length + logs.length

  const allDates = [
    ...entries.map(e => toDay(e.session_at)),
    ...logs.map(l => toDay(l.started_at)),
  ]

  const uniqueMethods = new Set([
    ...entries.map(e => e.consumption_method).filter(Boolean),
    ...logs.map(l => l.method).filter(Boolean),
  ])

  const ratedEntries = entries.filter(e => e.overall_rating != null)
  const uniqueSessionStrains = new Set(entries.map(e => e.strain_id).filter(Boolean))

  const terpsProducts = products.filter(p =>
    Array.isArray(p.terpenes) && p.terpenes.length > 0
  )

  const highCbdProducts = products.filter(p => (p.cbd_pct ?? 0) >= 10)

  return [
    // ── First steps
    {
      id: 'first_session',
      emoji: '🌿',
      name: 'First Steps',
      desc: 'Log your very first session.',
      tier: TIER.bronze,
      target: 1,
      current: Math.min(totalSessions, 1),
    },
    // ── Journal milestones
    {
      id: 'journal_5',
      emoji: '📓',
      name: 'Journal Keeper',
      desc: 'Write 5 journal entries.',
      tier: TIER.bronze,
      target: 5,
      current: Math.min(entries.length, 5),
    },
    {
      id: 'journal_25',
      emoji: '📚',
      name: 'Chronicler',
      desc: 'Write 25 journal entries.',
      tier: TIER.silver,
      target: 25,
      current: Math.min(entries.length, 25),
    },
    {
      id: 'journal_100',
      emoji: '🏛️',
      name: 'Historian',
      desc: 'Amass 100 journal entries.',
      tier: TIER.gold,
      target: 100,
      current: Math.min(entries.length, 100),
    },
    // ── Session volume
    {
      id: 'sessions_50',
      emoji: '🔥',
      name: 'Regular',
      desc: 'Log 50 total sessions.',
      tier: TIER.silver,
      target: 50,
      current: Math.min(totalSessions, 50),
    },
    {
      id: 'sessions_200',
      emoji: '💎',
      name: 'Dedicated',
      desc: 'Log 200 total sessions.',
      tier: TIER.gold,
      target: 200,
      current: Math.min(totalSessions, 200),
    },
    // ── Products
    {
      id: 'product_first',
      emoji: '🧪',
      name: 'Product Pioneer',
      desc: 'Add your first product to the catalog.',
      tier: TIER.bronze,
      target: 1,
      current: Math.min(products.length, 1),
    },
    {
      id: 'product_10',
      emoji: '🗃️',
      name: 'Collector',
      desc: 'Build a catalog of 10 products.',
      tier: TIER.silver,
      target: 10,
      current: Math.min(products.length, 10),
    },
    // ── Strains
    {
      id: 'strain_first',
      emoji: '🌱',
      name: 'Strain Scout',
      desc: 'Add your first strain.',
      tier: TIER.bronze,
      target: 1,
      current: Math.min(strains.length, 1),
    },
    {
      id: 'strain_5',
      emoji: '🌿',
      name: 'Strain Aficionado',
      desc: 'Collect 5 different strains.',
      tier: TIER.silver,
      target: 5,
      current: Math.min(strains.length, 5),
    },
    {
      id: 'strain_sessions_5',
      emoji: '🎲',
      name: 'Explorer',
      desc: 'Journal sessions with 5 distinct strains.',
      tier: TIER.silver,
      target: 5,
      current: Math.min(uniqueSessionStrains.size, 5),
    },
    // ── Terpenes
    {
      id: 'terps_first',
      emoji: '💧',
      name: 'Terpene Curious',
      desc: 'Add a product with terpene profile data.',
      tier: TIER.bronze,
      target: 1,
      current: Math.min(terpsProducts.length, 1),
    },
    {
      id: 'terps_5',
      emoji: '🔬',
      name: 'Terp Nerd',
      desc: '5 products in your catalog with terpene data.',
      tier: TIER.silver,
      target: 5,
      current: Math.min(terpsProducts.length, 5),
    },
    // ── Methods
    {
      id: 'methods_3',
      emoji: '🛠️',
      name: 'Method Explorer',
      desc: 'Try 3 different consumption methods.',
      tier: TIER.bronze,
      target: 3,
      current: Math.min(uniqueMethods.size, 3),
    },
    {
      id: 'methods_5',
      emoji: '🎯',
      name: 'Method Master',
      desc: 'Use all 5 main consumption methods.',
      tier: TIER.silver,
      target: 5,
      current: Math.min(uniqueMethods.size, 5),
    },
    // ── Ratings
    {
      id: 'rating_5star',
      emoji: '⭐',
      name: 'Perfect Score',
      desc: 'Give a 5/5 rating to a session.',
      tier: TIER.bronze,
      target: 1,
      current: Math.min(entries.filter(e => e.overall_rating === 5).length, 1),
    },
    {
      id: 'rated_10',
      emoji: '🧐',
      name: 'Connoisseur',
      desc: 'Rate 10 journal sessions.',
      tier: TIER.silver,
      target: 10,
      current: Math.min(ratedEntries.length, 10),
    },
    // ── CBD
    {
      id: 'cbd_curious',
      emoji: '💙',
      name: 'CBD Curious',
      desc: 'Add a product with ≥ 10% CBD.',
      tier: TIER.bronze,
      target: 1,
      current: Math.min(highCbdProducts.length, 1),
    },
    // ── Streaks (computed separately, but pre-fill here so component can use)
    {
      id: 'streak_3',
      emoji: '📅',
      name: 'Streak Starter',
      desc: 'Log sessions on 3 consecutive days.',
      tier: TIER.bronze,
      target: 3,
      current: Math.min(computeStreaks(allDates).longest, 3),
    },
    {
      id: 'streak_7',
      emoji: '🗓️',
      name: 'Week Warrior',
      desc: '7-day consecutive logging streak.',
      tier: TIER.silver,
      target: 7,
      current: Math.min(computeStreaks(allDates).longest, 7),
    },
    {
      id: 'streak_30',
      emoji: '🏆',
      name: 'Monthly Dedication',
      desc: 'Maintain a 30-day logging streak.',
      tier: TIER.gold,
      target: 30,
      current: Math.min(computeStreaks(allDates).longest, 30),
    },
  ]
}

// ── Achievement card ──────────────────────────────────────────────────────────

const TIER_LABEL = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' }

function AchievementCard({ ach }) {
  const unlocked = ach.current >= ach.target
  const pct = Math.round((ach.current / ach.target) * 100)

  return (
    <div className={[
      styles.card,
      unlocked  ? styles[`tier_${ach.tier}`] : styles.locked,
    ].join(' ')}>
      <span className={styles.emoji} aria-hidden="true">{ach.emoji}</span>
      <span className={[styles.tierBadge, styles[`badge_${ach.tier}`]].join(' ')}>
        {TIER_LABEL[ach.tier]}
      </span>
      <h3 className={styles.cardName}>{ach.name}</h3>
      <p className={styles.cardDesc}>{ach.desc}</p>

      {!unlocked && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={styles.progressLabel}>
            {ach.current}/{ach.target}
          </span>
        </div>
      )}

      {unlocked && (
        <span className={styles.checkmark} aria-label="Unlocked">✓</span>
      )}
    </div>
  )
}

// ── Streak display ────────────────────────────────────────────────────────────

function StreakDisplay({ current, longest }) {
  return (
    <div className={styles.streaks}>
      <div className={styles.streakBox}>
        <span className={styles.streakNum}>{current}</span>
        <span className={styles.streakLabel}>day streak</span>
      </div>
      <div className={styles.streakDivider} />
      <div className={styles.streakBox}>
        <span className={styles.streakNum}>{longest}</span>
        <span className={styles.streakLabel}>longest streak</span>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

const FILTER_OPTS = ['all', 'unlocked', 'locked']

export function AchievementsPage() {
  const [entries,  setEntries]  = useState([])
  const [logs,     setLogs]     = useState([])
  const [products, setProducts] = useState([])
  const [strains,  setStrains]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    Promise.all([
      listEntries({ limit: 500 }),
      listLogs({ limit: 500 }),
      listProducts({ limit: 500 }),
      listStrains({ limit: 500 }),
    ]).then(([eRes, lRes, pRes, sRes]) => {
      setEntries(eRes.data ?? [])
      setLogs(lRes.data ?? [])
      setProducts(pRes.data ?? [])
      setStrains(sRes.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const achievements = useMemo(
    () => defineAchievements({ entries, logs, products, strains }),
    [entries, logs, products, strains]
  )

  const streaks = useMemo(() => {
    const allDates = [
      ...entries.map(e => toDay(e.session_at)),
      ...logs.map(l => toDay(l.started_at)),
    ]
    return computeStreaks(allDates)
  }, [entries, logs])

  const displayed = useMemo(() => {
    if (filter === 'unlocked') return achievements.filter(a => a.current >= a.target)
    if (filter === 'locked')   return achievements.filter(a => a.current < a.target)
    return achievements
  }, [achievements, filter])

  const unlockedCount = achievements.filter(a => a.current >= a.target).length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Achievements</h1>
          <p className={styles.sub}>
            {loading
              ? 'Loading…'
              : <><span className="mono">{unlockedCount}</span> / {achievements.length} unlocked</>
            }
          </p>
        </div>

        <div className={styles.filterGroup} role="group" aria-label="Filter achievements">
          {FILTER_OPTS.map(f => (
            <button
              key={f}
              type="button"
              className={[styles.filterBtn, filter === f ? styles.filterActive : ''].join(' ')}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {!loading && (
        <StreakDisplay current={streaks.current} longest={streaks.longest} />
      )}

      {loading ? (
        <div className={styles.loading}>
          <span className="label-caps">Loading</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayed.map(ach => (
            <AchievementCard key={ach.id} ach={ach} />
          ))}
        </div>
      )}
    </div>
  )
}
