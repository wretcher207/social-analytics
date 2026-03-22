import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import { FavoriteBtn } from '@/components/ui/FavoriteBtn'
import { getStrain, deleteStrain } from '@/lib/strains'
import { listEntries } from '@/lib/journal'
import { Button } from '@/components/ui/Button'
import { EntryCard } from '@/components/journal/EntryCard'
import { CULTIVAR_COLOR, CULTIVAR_LABEL } from '@/components/strains/StrainCard'
import styles from './StrainDetailPage.module.css'

export function StrainDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [strain,    setStrain]    = useState(null)
  const [entries,   setEntries]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [deleting,  setDeleting]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getStrain(id),
      listEntries({ strain_id: id, limit: 5 }),
    ])
      .then(([s, j]) => { setStrain(s); setEntries(j.data ?? []) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteStrain(id)
      navigate('/strains')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  if (loading) {
    return <div className={styles.center}><span className="label-caps">Loading</span></div>
  }

  if (!strain) {
    return (
      <div className={styles.center}>
        <p className={styles.errorMsg}>{error || 'Strain not found.'}</p>
        <Button variant="ghost" onClick={() => navigate('/strains')}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Strains
        </Button>
      </div>
    )
  }

  const color = CULTIVAR_COLOR[strain.cultivar_type] ?? CULTIVAR_COLOR.unknown

  return (
    <div className={styles.page}>

      {/* Nav bar */}
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/strains')}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Strains
        </button>
        <div className={styles.topActions}>
          <FavoriteBtn type="strains" id={id} size={13} />
          <Button variant="ghost" size="sm" onClick={() => navigate(`/strains/${id}/edit`)}>
            <Edit2 size={12} strokeWidth={1.5} /> Edit
          </Button>

          {confirmDel ? (
            <>
              <Button size="sm" onClick={handleDelete} loading={deleting}>
                Confirm delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDel(true)}>
              <Trash2 size={12} strokeWidth={1.5} /> Delete
            </Button>
          )}
        </div>
      </div>

      {error && <p className={styles.errorMsg}>{error}</p>}

      {/* Header */}
      <header className={styles.header}>
        <span
          className={styles.cultivarBadge}
          style={{ color, borderColor: `${color}55` }}
        >
          {CULTIVAR_LABEL[strain.cultivar_type] ?? strain.cultivar_type ?? 'Unknown'}
        </span>
        <h1 className={styles.name}>{strain.name}</h1>
        {strain.brand && <p className={styles.brand}>{strain.brand}</p>}
        {strain.lineage && (
          <p className={styles.lineage}>
            <span className={styles.lineageLabel}>Lineage:</span> {strain.lineage}
          </p>
        )}
      </header>

      {/* Cannabinoid stats */}
      {(strain.thc_pct != null || strain.cbd_pct != null) && (
        <div className={styles.statsGrid}>
          {strain.thc_pct != null && (
            <div className={styles.stat}>
              <span className={styles.statVal}>
                {strain.thc_pct}<span className={styles.statUnit}>%</span>
              </span>
              <span className={styles.statLabel}>THC</span>
            </div>
          )}
          {strain.cbd_pct != null && (
            <div className={styles.stat}>
              <span className={styles.statVal}>
                {strain.cbd_pct}<span className={styles.statUnit}>%</span>
              </span>
              <span className={styles.statLabel}>CBD</span>
            </div>
          )}
        </div>
      )}

      {/* Terpene profile */}
      {strain.terpenes?.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Terpene profile</h3>
          <div className={styles.terpList}>
            {[...strain.terpenes]
              .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))
              .map(t => (
                <div key={t.name} className={styles.terpRow}>
                  <span className={styles.terpName}>{t.name}</span>
                  <div className={styles.terpTrack}>
                    <div
                      className={styles.terpFill}
                      style={{
                        width: `${Math.min((t.pct ?? 0) * 50, 100)}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <span className={styles.terpPct}>
                    {t.pct != null ? `${t.pct}%` : '—'}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Description */}
      {strain.description && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Description</h3>
          <p className={styles.description}>{strain.description}</p>
        </section>
      )}

      {/* Linked journal entries */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3 className={styles.sectionTitle}>Journal entries</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/journal/new?strain_id=${id}`)}
          >
            New entry
          </Button>
        </div>

        {entries.length === 0 ? (
          <p className={styles.noEntries}>No journal entries for this strain yet.</p>
        ) : (
          <div className={styles.entryList}>
            {entries.map(e => <EntryCard key={e.id} entry={e} />)}
          </div>
        )}
      </section>
    </div>
  )
}
