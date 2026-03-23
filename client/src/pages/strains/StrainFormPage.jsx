import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { createStrain, getStrain, updateStrain } from '@/lib/strains'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TerpeneEditor } from '@/components/products/TerpeneEditor'
import { CULTIVAR_TYPES } from '@/lib/constants'
import styles from './StrainFormPage.module.css'

export function StrainFormPage() {
  const navigate = useNavigate()
  const { id }   = useParams()
  const isEdit   = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const [name,         setName]         = useState('')
  const [brand,        setBrand]        = useState('')
  const [cultivarType, setCultivarType] = useState('unknown')
  const [thcPct,       setThcPct]       = useState('')
  const [cbdPct,       setCbdPct]       = useState('')
  const [terpenes,     setTerpenes]     = useState([])
  const [lineage,      setLineage]      = useState('')
  const [description,  setDescription]  = useState('')

  useEffect(() => {
    if (!isEdit) return
    getStrain(id)
      .then(s => {
        setName(s.name ?? '')
        setBrand(s.brand ?? '')
        setCultivarType(s.cultivar_type ?? 'unknown')
        setThcPct(s.thc_pct != null ? String(s.thc_pct) : '')
        setCbdPct(s.cbd_pct != null ? String(s.cbd_pct) : '')
        setTerpenes(s.terpenes ?? [])
        setLineage(s.lineage ?? '')
        setDescription(s.description ?? '')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setError('')
    setSaving(true)

    const payload = {
      name:         name.trim(),
      brand:        brand || undefined,
      cultivar_type: cultivarType,
      thc_pct:      thcPct ? parseFloat(thcPct)  : undefined,
      cbd_pct:      cbdPct ? parseFloat(cbdPct)  : undefined,
      terpenes:     terpenes.length ? terpenes : [],
      lineage:      lineage.trim() || undefined,
      description:  description.trim() || undefined,
    }

    try {
      const saved = isEdit
        ? await updateStrain(id, payload)
        : await createStrain(payload)
      navigate(`/strains/${saved.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={styles.center}><span className="label-caps">Loading</span></div>
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.back}
          onClick={() => navigate(isEdit ? `/strains/${id}` : '/strains')}
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          {isEdit ? 'Back to strain' : 'Strains'}
        </button>
        <h1 className={styles.title}>{isEdit ? 'Edit strain' : 'Add strain'}</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>

        {/* ── Identity ───────────────────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Identity</legend>

          <Input
            label="Strain name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Blue Dream"
            required
          />

          <div className={styles.row2}>
            <Input
              label="Brand / breeder"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="e.g. Humboldt Seed Co."
            />
            <Input
              label="Lineage (optional)"
              value={lineage}
              onChange={e => setLineage(e.target.value)}
              placeholder="e.g. Blueberry × Haze"
            />
          </div>
        </fieldset>

        {/* ── Cultivar type ──────────────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Type</legend>

          <div className={styles.typeGrid}>
            {CULTIVAR_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={[styles.typeBtn, cultivarType === t.value ? styles.typeActive : ''].join(' ')}
                onClick={() => setCultivarType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* ── Cannabinoids & terpenes ────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Cannabinoids &amp; Terpenes</legend>

          <div className={styles.row2}>
            <Input
              label="THC %"
              type="number"
              value={thcPct}
              onChange={e => setThcPct(e.target.value)}
              placeholder="e.g. 22"
              min="0" max="100" step="0.1"
            />
            <Input
              label="CBD %"
              type="number"
              value={cbdPct}
              onChange={e => setCbdPct(e.target.value)}
              placeholder="e.g. 0.1"
              min="0" max="100" step="0.1"
            />
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.label}>
              Terpenes <span className={styles.optional}>(optional)</span>
            </label>
            <TerpeneEditor value={terpenes} onChange={setTerpenes} />
          </div>
        </fieldset>

        {/* ── Description ───────────────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Description (optional)</legend>

          <textarea
            className={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Flavor profile, effects, growing notes…"
            rows={4}
            maxLength={1000}
          />
        </fieldset>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(isEdit ? `/strains/${id}` : '/strains')}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} size="lg">
            {isEdit ? 'Save changes' : 'Add to library'}
          </Button>
        </div>
      </form>
    </div>
  )
}
