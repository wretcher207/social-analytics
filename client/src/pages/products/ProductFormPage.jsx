import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, CheckCircle, AlertTriangle } from 'lucide-react'
import { createProduct, getProduct, updateProduct, scanLabel } from '@/lib/products'
import { listStrains } from '@/lib/strains'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TerpeneEditor } from '@/components/products/TerpeneEditor'
import {
  PRODUCT_CATEGORIES,
  CONCENTRATE_SUBCATEGORIES,
} from '@/lib/constants'
import styles from './ProductFormPage.module.css'

const VALID_CATS = ['flower','concentrate','edible','tincture','topical','vape','other']
const VALID_SUBS = ['live_resin','live_rosin','rosin','wax','shatter','badder','sugar','diamonds','sauce','hash','distillate','rso','other']

export function ProductFormPage() {
  const navigate  = useNavigate()
  const { id }    = useParams()           // present when editing
  const isEdit    = Boolean(id)

  const [strains, setStrains]       = useState([])
  const [loading, setLoading]       = useState(isEdit)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  // Form fields
  const [name, setName]             = useState('')
  const [category, setCategory]     = useState('flower')
  const [subcategory, setSubcategory] = useState('')
  const [brand, setBrand]           = useState('')
  const [dispensary, setDispensary] = useState('')
  const [strainId, setStrainId]     = useState('')
  const [thcPct, setThcPct]         = useState('')
  const [cbdPct, setCbdPct]         = useState('')
  const [terpenes, setTerpenes]     = useState([])
  const [weightG, setWeightG]       = useState('')
  const [remainingG, setRemainingG] = useState('')
  const [pricePaid, setPricePaid]   = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [purchasedAt, setPurchasedAt] = useState('')

  // Label scanner state
  const fileInputRef                    = useRef(null)
  const [scanPreview, setScanPreview]   = useState('')
  const [scanLoading, setScanLoading]   = useState(false)
  const [scanResult, setScanResult]     = useState(null)
  const [scanFilled, setScanFilled]     = useState(0)
  const [scanError, setScanError]       = useState('')

  // Load strains for picker
  useEffect(() => {
    listStrains({ limit: 200 }).then(r => setStrains(r.data ?? [])).catch(() => {})
  }, [])

  // Populate fields when editing
  useEffect(() => {
    if (!isEdit) return
    getProduct(id)
      .then(p => {
        setName(p.name ?? '')
        setCategory(p.category ?? 'flower')
        setSubcategory(p.subcategory ?? '')
        setBrand(p.brand ?? '')
        setDispensary(p.dispensary ?? '')
        setStrainId(p.strain_id ?? '')
        setThcPct(p.thc_pct != null ? String(p.thc_pct) : '')
        setCbdPct(p.cbd_pct != null ? String(p.cbd_pct) : '')
        setTerpenes(p.terpenes ?? [])
        setWeightG(p.weight_g != null ? String(p.weight_g) : '')
        setRemainingG(p.remaining_g != null ? String(p.remaining_g) : '')
        setPricePaid(p.price_paid != null ? String(p.price_paid) : '')
        setBatchNumber(p.batch_number ?? '')
        setPurchasedAt(p.purchased_at ? p.purchased_at.slice(0, 10) : '')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // ── Label scanner ──────────────────────────────────────────────────────────

  function applyOcrResult(result) {
    let count = 0
    if (result.name?.trim())             { setName(result.name.trim());                    count++ }
    if (result.brand?.trim())            { setBrand(result.brand.trim());                  count++ }
    if (result.dispensary?.trim())       { setDispensary(result.dispensary.trim());        count++ }
    if (VALID_CATS.includes(result.category)) {
      setCategory(result.category); count++
      if (result.category === 'concentrate' && VALID_SUBS.includes(result.subcategory)) {
        setSubcategory(result.subcategory); count++
      }
    }
    if (result.thc_pct != null)          { setThcPct(String(result.thc_pct));             count++ }
    if (result.cbd_pct != null)          { setCbdPct(String(result.cbd_pct));             count++ }
    if (result.terpenes?.length)         { setTerpenes(result.terpenes);                  count++ }
    if (result.weight_g != null)         {
      setWeightG(String(result.weight_g))
      if (!isEdit && !remainingG) setRemainingG(String(result.weight_g))
      count++
    }
    if (result.batch_number?.trim())     { setBatchNumber(result.batch_number.trim());    count++ }
    return count
  }

  async function handleScan(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setScanPreview(previewUrl)
    setScanLoading(true)
    setScanResult(null)
    setScanError('')
    setScanFilled(0)

    try {
      const result = await scanLabel(file)
      setScanResult(result)
      setScanFilled(applyOcrResult(result))
    } catch (err) {
      setScanError(err.message)
    } finally {
      setScanLoading(false)
    }
  }

  function clearScan() {
    if (scanPreview) URL.revokeObjectURL(scanPreview)
    setScanPreview('')
    setScanResult(null)
    setScanError('')
    setScanFilled(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Form submit ────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setError('')
    setSaving(true)

    const payload = {
      name:        name.trim(),
      category,
      subcategory: category === 'concentrate' ? (subcategory || undefined) : undefined,
      brand:       brand || undefined,
      dispensary:  dispensary || undefined,
      strain_id:   strainId || undefined,
      thc_pct:     thcPct ? parseFloat(thcPct) : undefined,
      cbd_pct:     cbdPct ? parseFloat(cbdPct) : undefined,
      terpenes:    terpenes.length ? terpenes : [],
      weight_g:    weightG    ? parseFloat(weightG)    : undefined,
      remaining_g: remainingG ? parseFloat(remainingG) : undefined,
      price_paid:  pricePaid  ? parseFloat(pricePaid)  : undefined,
      batch_number: batchNumber || undefined,
      purchased_at: purchasedAt ? new Date(purchasedAt).toISOString() : undefined,
    }

    try {
      const saved = isEdit
        ? await updateProduct(id, payload)
        : await createProduct(payload)
      navigate(`/products/${saved.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.center}>
        <span className="label-caps">Loading</span>
      </div>
    )
  }

  // Auto-fill remaining_g when weight is set for new products
  function handleWeightChange(val) {
    setWeightG(val)
    if (!isEdit && !remainingG) setRemainingG(val)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(isEdit ? `/products/${id}` : '/products')}>
          <ArrowLeft size={14} strokeWidth={1.5} />
          {isEdit ? 'Back to product' : 'Products'}
        </button>
        <h1 className={styles.title}>{isEdit ? 'Edit product' : 'Add product'}</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>

        {/* ── Label scanner ──────────────────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>
            <span className={styles.groupTitleInner}>
              <Camera size={10} strokeWidth={1.5} />
              Scan label
              <span className={styles.aiBadge}>AI</span>
            </span>
          </legend>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className={styles.hiddenFile}
            onChange={handleScan}
            capture="environment"
          />

          {!scanPreview ? (
            <button
              type="button"
              className={styles.scanTrigger}
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={20} strokeWidth={1} className={styles.scanIcon} />
              <span className={styles.scanTriggerText}>
                Photograph a label or COA to auto-fill fields
              </span>
              <span className={styles.scanTriggerHint}>JPEG · PNG · WEBP</span>
            </button>
          ) : (
            <div className={styles.scanRow}>
              <img src={scanPreview} alt="Label preview" className={styles.previewImg} />

              <div className={styles.scanStatus}>
                {scanLoading && (
                  <span className={styles.scanMsg}>
                    <span className={styles.spinner} aria-hidden="true" />
                    Extracting fields…
                  </span>
                )}
                {!scanLoading && scanFilled > 0 && (
                  <span className={[styles.scanMsg, styles.scanOk].join(' ')}>
                    <CheckCircle size={13} strokeWidth={1.5} />
                    {scanFilled} field{scanFilled !== 1 ? 's' : ''} filled from label
                  </span>
                )}
                {!scanLoading && scanFilled === 0 && scanResult && (
                  <span className={[styles.scanMsg, styles.scanWarn].join(' ')}>
                    No data detected — try a clearer image
                  </span>
                )}
                {!scanLoading && scanError && (
                  <span className={[styles.scanMsg, styles.scanErr].join(' ')}>
                    <AlertTriangle size={12} strokeWidth={1.5} />
                    {scanError}
                  </span>
                )}
                {scanResult?.strain_name && (
                  <span className={styles.strainNote}>
                    Strain detected: <em>{scanResult.strain_name}</em> — select it in the Strain section below.
                  </span>
                )}
                <button type="button" className={styles.rescanBtn} onClick={() => fileInputRef.current?.click()}>
                  Re-scan
                </button>
              </div>

              <button type="button" className={styles.clearBtn} onClick={clearScan} aria-label="Clear scan">
                ✕
              </button>
            </div>
          )}
        </fieldset>

        {/* ── Core identity ─────────────────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Identity</legend>

          <Input
            label="Product name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Papaya Cake Live Rosin"
            required
          />

          <div className={styles.row2}>
            <Input
              label="Brand"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="e.g. Stiiizy"
            />
            <Input
              label="Dispensary"
              value={dispensary}
              onChange={e => setDispensary(e.target.value)}
              placeholder="e.g. MedMen Hollywood"
            />
          </div>
        </fieldset>

        {/* ── Category ──────────────────────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Category</legend>

          <div className={styles.fieldBlock}>
            <label className={styles.label}>Type</label>
            <div className={styles.catGrid}>
              {PRODUCT_CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={[styles.catBtn, category === c.value ? styles.catActive : ''].join(' ')}
                  onClick={() => { setCategory(c.value); setSubcategory('') }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {category === 'concentrate' && (
            <div className={styles.fieldBlock}>
              <label className={styles.label}>Concentrate type</label>
              <div className={styles.catGrid}>
                {CONCENTRATE_SUBCATEGORIES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    className={[styles.catBtn, subcategory === s.value ? styles.catActive : ''].join(' ')}
                    onClick={() => setSubcategory(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* ── Strain link ───────────────────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Strain</legend>
          <div className={styles.fieldBlock}>
            <label className={styles.label}>Linked strain <span className={styles.optional}>(optional)</span></label>
            <select
              className={styles.select}
              value={strainId}
              onChange={e => setStrainId(e.target.value)}
            >
              <option value="">— None —</option>
              {strains.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.cultivar_type ? ` (${s.cultivar_type})` : ''}{s.brand ? ` · ${s.brand}` : ''}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* ── Cannabinoids & terpenes ────────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Cannabinoids &amp; Terpenes</legend>

          <div className={styles.row2}>
            <Input
              label="THC %"
              type="number"
              value={thcPct}
              onChange={e => setThcPct(e.target.value)}
              placeholder="e.g. 24.5"
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
            <label className={styles.label}>Terpenes <span className={styles.optional}>(from COA)</span></label>
            <TerpeneEditor value={terpenes} onChange={setTerpenes} />
          </div>
        </fieldset>

        {/* ── Inventory & purchase ──────────────────────────────────────── */}
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Inventory &amp; Purchase</legend>

          <div className={styles.row3}>
            <Input
              label="Original weight (g)"
              type="number"
              value={weightG}
              onChange={e => handleWeightChange(e.target.value)}
              placeholder="e.g. 3.5"
              min="0" step="0.001"
            />
            <Input
              label="Remaining (g)"
              type="number"
              value={remainingG}
              onChange={e => setRemainingG(e.target.value)}
              placeholder="e.g. 3.5"
              min="0" step="0.001"
            />
            <Input
              label="Price paid ($)"
              type="number"
              value={pricePaid}
              onChange={e => setPricePaid(e.target.value)}
              placeholder="e.g. 65.00"
              min="0" step="0.01"
            />
          </div>

          <div className={styles.row2}>
            <Input
              label="Batch / lot number"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              placeholder="e.g. BT240312A"
            />
            <Input
              label="Purchase date"
              type="date"
              value={purchasedAt}
              onChange={e => setPurchasedAt(e.target.value)}
            />
          </div>
        </fieldset>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(isEdit ? `/products/${id}` : '/products')}
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
