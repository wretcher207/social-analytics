import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import styles from './DoseCalcPage.module.css'

// ── Bioavailability by method ──────────────────────────────────────────────
// Midpoint estimates from published literature
const BIO = {
  flower:      0.30,   // 20–35 %
  concentrate: 0.45,   // 40–50 %
  vape:        0.34,   // 30–38 %
  edible:      0.10,   // 4–20 % first-pass metabolism
  tincture:    0.20,   // sublingual ~20 %
}

// ── Dose guidance (mg active THC) by tolerance tier ───────────────────────
const TIERS = [
  {
    key:   'microdose',
    label: 'Microdose',
    range: [1, 2.5],
    desc:  'Subtle, functional. Good for first-timers or daytime use.',
    cls:   'green',
  },
  {
    key:   'low',
    label: 'Low',
    range: [2.5, 5],
    desc:  'Mild effect, noticeable but easily manageable.',
    cls:   'teal',
  },
  {
    key:   'moderate',
    label: 'Moderate',
    range: [5, 10],
    desc:  'Clear psychoactive effect. Common recreational dose.',
    cls:   'gold',
  },
  {
    key:   'high',
    label: 'High',
    range: [10, 20],
    desc:  'Strong effect. Suitable for experienced consumers.',
    cls:   'orange',
  },
  {
    key:   'heavy',
    label: 'Heavy',
    range: [20, 50],
    desc:  'Very strong. High-tolerance consumers only.',
    cls:   'red',
  },
]

const METHODS = [
  { value: 'flower',      label: 'Flower',      unit: 'g' },
  { value: 'concentrate', label: 'Concentrate', unit: 'g' },
  { value: 'vape',        label: 'Vape',        unit: 'g' },
  { value: 'edible',      label: 'Edible',      unit: 'mg' },
  { value: 'tincture',    label: 'Tincture',    unit: 'mL' },
]

// ── Calc helpers ───────────────────────────────────────────────────────────

/**
 * Returns { totalMgThc, activeMgThc, doseGrams, doseMg }
 *
 * For edibles the user enters mg THC directly (no thc% needed).
 * For all others: amount in grams × thc% / 100 × 1000 = mg THC consumed.
 */
function calcDose({ method, amountG, amountMg, thcPct, sessionDoseG, sessionDoseMg }) {
  const bio = BIO[method] ?? 0.30

  let totalMgThcInProduct = null
  let sessionMgThcRaw     = null
  let sessionMgThcActive  = null

  if (method === 'edible') {
    // User enters mg THC per piece / per serving
    sessionMgThcRaw    = Number(amountMg) || 0
    sessionMgThcActive = sessionMgThcRaw * bio
    totalMgThcInProduct = null
  } else {
    // Amount in grams × THC% × 10 = mg THC (since 1 g = 1000 mg, × pct/100)
    const pct = Number(thcPct) || 0
    const total = (Number(amountG) || 0) * pct * 10        // total mg in product
    const session = (Number(sessionDoseG) || 0) * pct * 10 // mg in this session
    totalMgThcInProduct = total
    sessionMgThcRaw    = session
    sessionMgThcActive = session * bio
  }

  return { totalMgThcInProduct, sessionMgThcRaw, sessionMgThcActive, bio }
}

/** How many grams to consume to hit a target mg active THC */
function gramsForActiveMg(targetMg, thcPct, method) {
  const bio = BIO[method] ?? 0.30
  const pct = Number(thcPct) || 0
  if (pct === 0) return null
  return targetMg / (bio * pct * 10)
}

/** How many mg edible to consume for a target mg active THC */
function mgEdibleForActiveMg(targetMg, method) {
  const bio = BIO[method] ?? 0.10
  return targetMg / bio
}

// ── Tier bar ───────────────────────────────────────────────────────────────

function TierRow({ tier, activeMg, method, thcPct }) {
  const [lo, hi] = tier.range
  const inRange = activeMg != null && activeMg >= lo && activeMg < hi

  // How much product gets you into this tier?
  const loAmount = method === 'edible'
    ? mgEdibleForActiveMg(lo, method).toFixed(1)
    : gramsForActiveMg(lo, thcPct, method)?.toFixed(3) ?? '—'
  const hiAmount = method === 'edible'
    ? mgEdibleForActiveMg(hi, method).toFixed(1)
    : gramsForActiveMg(hi, thcPct, method)?.toFixed(3) ?? '—'

  const mUnit = METHODS.find(m => m.value === method)?.unit ?? 'g'

  return (
    <div className={[styles.tier, inRange ? styles.tierActive : '', styles[`tier_${tier.cls}`]].join(' ')}>
      <div className={styles.tierHeader}>
        <span className={styles.tierLabel}>{tier.label}</span>
        <span className={styles.tierRange}>{lo}–{hi} mg active THC</span>
        {inRange && <span className={styles.tierYou}>← YOU</span>}
      </div>
      <p className={styles.tierDesc}>{tier.desc}</p>
      <p className={styles.tierAmount}>
        {loAmount}–{hiAmount} {mUnit}
        {method !== 'edible' && <span className={styles.tierAmountNote}> to consume</span>}
        {method === 'edible' && <span className={styles.tierAmountNote}> mg product</span>}
      </p>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export function DoseCalcPage() {
  const [method,   setMethod]   = useState('flower')
  const [thcPct,   setThcPct]   = useState('')
  const [amountG,  setAmountG]  = useState('')   // total product (non-edible)
  const [sessionG, setSessionG] = useState('')   // per-session dose (non-edible)
  const [amountMg, setAmountMg] = useState('')   // per-serving mg (edible)

  const isEdible  = method === 'edible'
  const isTinct   = method === 'tincture'
  const mInfo     = METHODS.find(m => m.value === method)

  const result = useMemo(() => {
    if (isEdible) {
      if (!amountMg) return null
    } else {
      if (!thcPct || !sessionG) return null
    }
    return calcDose({ method, amountG, amountMg, thcPct, sessionDoseG: sessionG, sessionDoseMg: amountMg })
  }, [method, thcPct, amountG, amountMg, sessionG, isEdible])

  const activeMg = result?.sessionMgThcActive ?? null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Calculator size={20} strokeWidth={1.5} className={styles.icon} />
        <div>
          <h1 className={styles.title}>Dose Calculator</h1>
          <p className={styles.sub}>Estimate active THC from any product and dose</p>
        </div>
      </header>

      {/* ── Inputs ─────────────────────────────────────────────────── */}
      <section className={styles.card}>
        {/* Method */}
        <div className={styles.field}>
          <label className={styles.label}>Consumption method</label>
          <div className={styles.methodGrid}>
            {METHODS.map(m => (
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

        {/* THC % — hidden for edibles */}
        {!isEdible && (
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>THC %</label>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  className={styles.input}
                  value={thcPct}
                  min={0}
                  max={100}
                  step={0.1}
                  onChange={e => setThcPct(e.target.value)}
                  placeholder="e.g. 22"
                />
                <span className={styles.unit}>%</span>
              </div>
              {thcPct && (
                <input
                  type="range"
                  className={styles.slider}
                  value={thcPct}
                  min={0}
                  max={isTinct ? 50 : 100}
                  step={0.5}
                  onChange={e => setThcPct(e.target.value)}
                />
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Total product ({mInfo?.unit})</label>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  className={styles.input}
                  value={amountG}
                  min={0}
                  step={0.01}
                  onChange={e => setAmountG(e.target.value)}
                  placeholder="e.g. 3.5"
                />
                <span className={styles.unit}>{mInfo?.unit}</span>
              </div>
            </div>
          </div>
        )}

        {/* Session dose */}
        <div className={styles.field}>
          <label className={styles.label}>
            {isEdible ? 'mg THC per serving / piece' : `Session dose (${mInfo?.unit})`}
          </label>
          <div className={styles.inputRow}>
            {isEdible ? (
              <input
                type="number"
                className={styles.input}
                value={amountMg}
                min={0}
                step={1}
                onChange={e => setAmountMg(e.target.value)}
                placeholder="e.g. 10"
              />
            ) : (
              <input
                type="number"
                className={styles.input}
                value={sessionG}
                min={0}
                step={0.001}
                onChange={e => setSessionG(e.target.value)}
                placeholder={method === 'concentrate' ? 'e.g. 0.05' : 'e.g. 0.3'}
              />
            )}
            <span className={styles.unit}>{isEdible ? 'mg' : mInfo?.unit}</span>
          </div>
        </div>

        {/* Result panel */}
        {result && (
          <div className={styles.resultPanel}>
            <div className={styles.resultGrid}>
              <div className={styles.resultCell}>
                <span className={styles.resultBig}>
                  {result.sessionMgThcRaw.toFixed(1)}
                </span>
                <span className={styles.resultLabel}>mg THC consumed</span>
              </div>
              <div className={styles.resultDiv} />
              <div className={styles.resultCell}>
                <span className={styles.resultBig}>
                  {result.sessionMgThcActive.toFixed(1)}
                </span>
                <span className={styles.resultLabel}>mg active (absorbed)</span>
              </div>
              <div className={styles.resultDiv} />
              <div className={styles.resultCell}>
                <span className={styles.resultBig}>
                  {Math.round(result.bio * 100)}
                </span>
                <span className={styles.resultLabel}>% bioavailability</span>
              </div>
              {result.totalMgThcInProduct != null && amountG && (
                <>
                  <div className={styles.resultDiv} />
                  <div className={styles.resultCell}>
                    <span className={styles.resultBig}>
                      {result.totalMgThcInProduct.toFixed(0)}
                    </span>
                    <span className={styles.resultLabel}>mg total in product</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Dose tiers ──────────────────────────────────────────────── */}
      <section className={styles.tiers}>
        <h2 className={styles.tiersTitle}>Dose tiers</h2>
        <p className={styles.tiersSub}>
          Based on absorbed THC. Values are generalised guidelines — individual responses vary.
        </p>
        <div className={styles.tierList}>
          {TIERS.map(t => (
            <TierRow
              key={t.key}
              tier={t}
              activeMg={activeMg}
              method={method}
              thcPct={thcPct}
            />
          ))}
        </div>
      </section>

      <p className={styles.disclaimer}>
        This calculator provides estimates only. Bioavailability, potency, and effects vary
        significantly between individuals. Start low and go slow.
      </p>
    </div>
  )
}
