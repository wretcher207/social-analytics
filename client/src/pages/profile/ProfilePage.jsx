import { useState, useEffect } from 'react'
import { Download, Save, AlertTriangle, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getProfile, updateProfile, exportAndDownload } from '@/lib/profile'
import { Button } from '@/components/ui/Button'
import styles from './ProfilePage.module.css'

// ── Avatar ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#c8a96e', '#8b7baf', '#6b9bb8', '#7dc98c', '#c87070',
  '#a06b8b', '#6b8ba0', '#b89a6c',
]

function avatarColor(id = '') {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function initials(displayName, email) {
  const name = displayName?.trim() || email || '?'
  const parts = name.split(/[\s@]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Stat chip ─────────────────────────────────────────────────────────────────
function Stat({ value, label }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value ?? '—'}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { signOut }  = useAuth()
  const navigate     = useNavigate()

  const [profile,       setProfile]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [fetchErr,      setFetchErr]      = useState('')

  const [displayName,   setDisplayName]   = useState('')
  const [timezone,      setTimezone]      = useState('')

  const [saving,        setSaving]        = useState(false)
  const [saveErr,       setSaveErr]       = useState('')
  const [savedOk,       setSavedOk]       = useState(false)

  const [exporting,     setExporting]     = useState(false)
  const [exportErr,     setExportErr]     = useState('')

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    getProfile()
      .then(data => {
        setProfile(data)
        setDisplayName(data.display_name ?? '')
        setTimezone(data.timezone ?? '')
      })
      .catch(e => setFetchErr(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Save settings ───────────────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveErr('')
    setSavedOk(false)
    try {
      await updateProfile({ display_name: displayName, timezone })
      setProfile(p => ({ ...p, display_name: displayName, timezone }))
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch (err) {
      setSaveErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true)
    setExportErr('')
    try {
      await exportAndDownload()
    } catch (err) {
      setExportErr(err.message)
    } finally {
      setExporting(false)
    }
  }

  // ── Sign out ────────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.skeletonAvatar} />
        <div className={styles.skeletonLines}>
          <div className={styles.skeletonLine} style={{ width: '140px' }} />
          <div className={styles.skeletonLine} style={{ width: '200px' }} />
        </div>
      </div>
    )
  }

  if (fetchErr) {
    return (
      <div className={styles.errorWrap}>
        <AlertTriangle size={14} strokeWidth={1.5} />
        {fetchErr}
      </div>
    )
  }

  const color = avatarColor(profile.id)
  const inits = initials(profile.display_name, profile.email)
  const memberYear = profile.member_since
    ? new Date(profile.member_since).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null

  return (
    <div className={styles.page}>
      {/* ── Profile header ── */}
      <header className={styles.profileHeader}>
        <div className={styles.avatar} style={{ background: color }}>
          {inits}
        </div>
        <div className={styles.profileMeta}>
          <h1 className={styles.profileName}>
            {profile.display_name || profile.email}
          </h1>
          {profile.display_name && (
            <span className={styles.profileEmail}>{profile.email}</span>
          )}
          {memberYear && (
            <span className={styles.memberSince}>Member since {memberYear}</span>
          )}
        </div>
      </header>

      {/* ── Stats strip ── */}
      <div className={styles.statsStrip}>
        <Stat value={profile.stats.session_count} label="sessions" />
        <div className={styles.statDivider} />
        <Stat
          value={profile.stats.avg_rating != null ? `${profile.stats.avg_rating}★` : null}
          label="avg rating"
        />
        <div className={styles.statDivider} />
        <Stat value={profile.stats.product_count} label="products" />
        <div className={styles.statDivider} />
        <Stat value={profile.stats.strain_count} label="strains" />
      </div>

      {profile.stats.top_effects?.length > 0 && (
        <div className={styles.topEffects}>
          <span className={styles.topEffectsLabel}>Top effects</span>
          {profile.stats.top_effects.map(ef => (
            <span key={ef} className={styles.effectPill}>{ef}</span>
          ))}
        </div>
      )}

      {/* ── Settings form ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile</h2>
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Display name</label>
            <input
              className={styles.input}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={profile.email}
              maxLength={60}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Timezone</label>
            <div className={styles.tzRow}>
              <input
                className={styles.input}
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                placeholder="e.g. America/New_York"
              />
              <button
                type="button"
                className={styles.tzLocalBtn}
                onClick={() => setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)}
              >
                Use local
              </button>
            </div>
          </div>

          {saveErr && (
            <p className={styles.saveErr}>
              <AlertTriangle size={12} strokeWidth={1.5} />
              {saveErr}
            </p>
          )}
          {savedOk && (
            <p className={styles.saveOk}>Profile updated.</p>
          )}

          <div className={styles.formActions}>
            <Button type="submit" loading={saving} size="sm">
              <Save size={12} strokeWidth={1.5} />
              Save changes
            </Button>
          </div>
        </form>
      </section>

      {/* ── Data export ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data export</h2>
        <p className={styles.sectionDesc}>
          Download all your journal entries, products, and profile data as a single JSON file.
        </p>
        {exportErr && (
          <p className={styles.saveErr} style={{ marginBottom: 'var(--space-3)' }}>
            <AlertTriangle size={12} strokeWidth={1.5} />
            {exportErr}
          </p>
        )}
        <Button variant="ghost" size="sm" loading={exporting} onClick={handleExport}>
          <Download size={12} strokeWidth={1.5} />
          {exporting ? 'Preparing…' : 'Download your data'}
        </Button>
      </section>

      {/* ── Account ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className={styles.signOutBtn}>
          <LogOut size={12} strokeWidth={1.5} />
          Sign out
        </Button>
      </section>
    </div>
  )
}
