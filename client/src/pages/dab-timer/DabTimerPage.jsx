import { useState, useRef, useCallback, useEffect } from 'react'
import { RotateCcw, Play, Pause, Thermometer, ClipboardCheck } from 'lucide-react'
import { createLog } from '@/lib/consumption'
import styles from './DabTimerPage.module.css'

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  {
    id:       'flavor',
    label:    'Flavor',
    range:    '315–450 °F',
    seconds:  45,
    color:    '#c8a96e',
    terpenes: ['Myrcene', 'Limonene', 'Linalool', 'Terpinolene'],
    note:     'Full terpene expression. Light, complex vapor.',
  },
  {
    id:       'balance',
    label:    'Balance',
    range:    '450–600 °F',
    seconds:  30,
    color:    '#8b7baf',
    terpenes: ['Caryophyllene', 'Humulene', 'Pinene', 'Myrcene'],
    note:     'Broad terpene activity with moderate vapor density.',
  },
  {
    id:       'potency',
    label:    'Potency',
    range:    '600–750 °F',
    seconds:  15,
    color:    '#c87070',
    terpenes: ['Caryophyllene', 'Myrcene'],
    note:     'Dense, full-spectrum vapor. Terpene expression reduced.',
  },
]

// Cold-start temperature milestones (seconds elapsed → zone)
const COLD_ZONES = [
  { from: 0,  to: 20, label: 'Heating up', color: '#6b9bb8' },
  { from: 20, to: 35, label: 'Flavor zone · 315–450 °F', color: '#c8a96e' },
  { from: 35, to: 50, label: 'Balance zone · 450–600 °F', color: '#8b7baf' },
  { from: 50, to: Infinity, label: 'Potency zone · 600 °F+', color: '#c87070' },
]

function getColdZone(elapsed) {
  return COLD_ZONES.find(z => elapsed >= z.from && elapsed < z.to) ?? COLD_ZONES[3]
}

// ── Web Audio beeps ───────────────────────────────────────────────────────────
function playTone(ctx, freq, duration, gain = 0.3) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.frequency.value = freq
  osc.type = 'sine'
  amp.gain.setValueAtTime(gain, ctx.currentTime)
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function playWarning(ctx) {
  playTone(ctx, 880, 0.15, 0.25)
  setTimeout(() => playTone(ctx, 880, 0.15, 0.25), 200)
}

function playDone(ctx) {
  playTone(ctx, 523, 0.15, 0.4)
  setTimeout(() => playTone(ctx, 659, 0.15, 0.4), 180)
  setTimeout(() => playTone(ctx, 784, 0.25, 0.5), 360)
}

// ── SVG ring ─────────────────────────────────────────────────────────────────
const R           = 88
const CIRCUMFERENCE = 2 * Math.PI * R  // ≈ 553

function ProgressRing({ progress, color, pulse }) {
  const offset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, progress)))
  return (
    <svg viewBox="0 0 200 200" className={styles.ring}>
      {/* Track */}
      <circle cx={100} cy={100} r={R} fill="none"
        stroke="var(--color-border)" strokeWidth={3} />
      {/* Progress arc */}
      <circle cx={100} cy={100} r={R} fill="none"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 100 100)"
        className={pulse ? styles.ringPulse : ''}
        style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s ease' }}
      />
    </svg>
  )
}

// ── Format seconds → mm:ss ────────────────────────────────────────────────────
function fmt(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

// ── Main component ────────────────────────────────────────────────────────────
export function DabTimerPage() {
  const [mode,          setMode]          = useState('hot')   // 'hot' | 'cold'
  const [selectedId,    setSelectedId]    = useState('balance')
  const [customSecs,    setCustomSecs]    = useState(30)
  const [phase,         setPhase]         = useState('idle')  // idle | running | paused | done
  const [remaining,     setRemaining]     = useState(null)    // hot mode
  const [elapsed,       setElapsed]       = useState(0)       // cold mode
  const [soundEnabled,  setSoundEnabled]  = useState(true)
  const [logged,        setLogged]        = useState(false)

  const intervalRef  = useRef(null)
  const audioCtxRef  = useRef(null)
  const warnedRef    = useRef(false)

  const preset       = selectedId === 'custom' ? null : PRESETS.find(p => p.id === selectedId)
  const totalSecs    = preset?.seconds ?? customSecs
  const activeColor  = preset?.color ?? '#6b9bb8'
  const coldZone     = getColdZone(elapsed)

  // ── Audio context (lazy init on first user gesture) ───────────────────────
  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ?? window.webkitAudioContext)()
    }
    return audioCtxRef.current
  }

  // ── Timer controls ────────────────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  function startHot() {
    const start = remaining ?? totalSecs
    warnedRef.current = false
    setPhase('running')
    setRemaining(start)
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current)
          setPhase('done')
          if (soundEnabled) playDone(getAudioCtx())
          return 0
        }
        if (r === 6 && !warnedRef.current) {
          warnedRef.current = true
          if (soundEnabled) playWarning(getAudioCtx())
        }
        return r - 1
      })
    }, 1000)
  }

  function startCold() {
    setPhase('running')
    setElapsed(0)
    intervalRef.current = setInterval(() => {
      setElapsed(e => e + 1)
    }, 1000)
  }

  function handleStart() {
    if (mode === 'hot') startHot()
    else startCold()
  }

  function handlePause() {
    clearTimer()
    setPhase('paused')
  }

  function handleResume() {
    if (mode === 'hot') startHot()
    else {
      setPhase('running')
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1)
      }, 1000)
    }
  }

  function handleReset() {
    clearTimer()
    setPhase('idle')
    setRemaining(null)
    setElapsed(0)
    setLogged(false)
    warnedRef.current = false
  }

  async function handleLogSession() {
    try {
      await createLog({ method: 'dab', started_at: new Date().toISOString() })
      setLogged(true)
    } catch (_) {
      // non-blocking — timer still works
    }
  }

  // Cleanup on unmount
  useEffect(() => () => clearTimer(), [clearTimer])

  // ── Derived display values ────────────────────────────────────────────────
  const isRunning = phase === 'running'
  const isDone    = phase === 'done'
  const isPaused  = phase === 'paused'
  const isActive  = isRunning || isPaused || isDone

  let progress, displayTime, ringColor, statusLine
  if (mode === 'hot') {
    const rem = remaining ?? totalSecs
    progress    = rem / totalSecs
    displayTime = fmt(rem)
    ringColor   = isDone ? '#7dc98c' : activeColor
    statusLine  = isDone
      ? 'Dab now'
      : isRunning ? 'Cooling down' : isPaused ? 'Paused' : 'Ready'
  } else {
    progress    = Math.min(elapsed / 60, 1)  // fill over 60s
    displayTime = fmt(elapsed)
    ringColor   = isDone ? '#7dc98c' : coldZone.color
    statusLine  = isDone ? 'Stop heating' : isRunning ? coldZone.label : isPaused ? 'Paused' : 'Ready'
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Page header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dab Timer</h1>
          <p className={styles.sub}>Precision cooling for optimal terpene expression</p>
        </div>
        <div className={styles.headerRight}>
          {/* Mode toggle */}
          <div className={styles.modeToggle} role="group">
            {['hot', 'cold'].map(m => (
              <button
                key={m}
                type="button"
                className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ''}`}
                onClick={() => { handleReset(); setMode(m) }}
                disabled={isRunning}
              >
                {m === 'hot' ? 'Hot start' : 'Cold start'}
              </button>
            ))}
          </div>
          {/* Sound toggle */}
          <button
            type="button"
            className={`${styles.soundBtn} ${soundEnabled ? styles.soundOn : ''}`}
            onClick={() => setSoundEnabled(v => !v)}
            title={soundEnabled ? 'Mute beeps' : 'Unmute beeps'}
          >
            {soundEnabled ? '♪' : '♪̸'}
          </button>
        </div>
      </header>

      {/* Timer ring */}
      <div className={`${styles.ringWrap} ${isDone ? styles.ringWrapDone : ''}`}>
        <ProgressRing progress={progress} color={ringColor} pulse={isDone} />
        <div className={styles.ringCenter}>
          <span className={`${styles.countdown} ${isDone ? styles.countdownDone : ''}`}>
            {displayTime}
          </span>
          <span className={styles.statusLine} style={{ color: isDone ? '#7dc98c' : ringColor }}>
            {statusLine}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {!isActive && (
          <button type="button" className={styles.btnStart} onClick={handleStart}>
            <Play size={14} strokeWidth={1.5} />
            Start
          </button>
        )}
        {isRunning && (
          <button type="button" className={styles.btnPause} onClick={handlePause}>
            <Pause size={14} strokeWidth={1.5} />
            Pause
          </button>
        )}
        {isPaused && (
          <button type="button" className={styles.btnStart} onClick={handleResume}>
            <Play size={14} strokeWidth={1.5} />
            Resume
          </button>
        )}
        {isActive && (
          <button type="button" className={styles.btnReset} onClick={handleReset}>
            <RotateCcw size={14} strokeWidth={1.5} />
            Reset
          </button>
        )}
        {isDone && (
          <button
            type="button"
            className={logged ? styles.btnLogged : styles.btnLog}
            onClick={handleLogSession}
            disabled={logged}
          >
            <ClipboardCheck size={14} strokeWidth={1.5} />
            {logged ? 'Logged' : 'Save to log'}
          </button>
        )}
      </div>

      {/* Presets (hot start only) */}
      {mode === 'hot' && (
        <div className={styles.presets}>
          {PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`${styles.presetBtn} ${selectedId === p.id ? styles.presetBtnActive : ''}`}
              style={selectedId === p.id ? { borderColor: p.color, color: p.color } : {}}
              onClick={() => { if (!isRunning) { setSelectedId(p.id); setRemaining(null) } }}
              disabled={isRunning}
            >
              <span className={styles.presetLabel}>{p.label}</span>
              <span className={styles.presetSeconds}>{p.seconds}s</span>
              <span className={styles.presetRange}>{p.range}</span>
            </button>
          ))}
          <button
            type="button"
            className={`${styles.presetBtn} ${selectedId === 'custom' ? styles.presetBtnActive : ''}`}
            onClick={() => { if (!isRunning) setSelectedId('custom') }}
            disabled={isRunning}
          >
            <span className={styles.presetLabel}>Custom</span>
            <span className={styles.presetSeconds}>{customSecs}s</span>
            <span className={styles.presetRange}>manual</span>
          </button>
        </div>
      )}

      {/* Custom timer input */}
      {mode === 'hot' && selectedId === 'custom' && (
        <div className={styles.customRow}>
          <label className={styles.customLabel}>Duration (seconds)</label>
          <input
            type="number"
            min={5}
            max={300}
            value={customSecs}
            onChange={e => { setCustomSecs(Math.max(5, Math.min(300, +e.target.value))); setRemaining(null) }}
            disabled={isRunning}
            className={styles.customInput}
          />
          <span className={styles.customHint}>5 – 300 s</span>
        </div>
      )}

      {/* Terpene info card (hot start + preset selected) */}
      {mode === 'hot' && preset && (
        <div className={styles.infoCard} style={{ borderColor: `${preset.color}33` }}>
          <div className={styles.infoCardTop}>
            <Thermometer size={12} strokeWidth={1.5} style={{ color: preset.color }} />
            <span className={styles.infoCardRange} style={{ color: preset.color }}>{preset.range}</span>
          </div>
          <p className={styles.infoCardNote}>{preset.note}</p>
          <div className={styles.infoCardTerpenes}>
            {preset.terpenes.map(t => (
              <span key={t} className={styles.terpenePill} style={{ borderColor: `${preset.color}40`, color: preset.color }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cold start guide */}
      {mode === 'cold' && (
        <div className={styles.coldGuide}>
          <h3 className={styles.coldGuideTitle}>Temperature timeline</h3>
          <div className={styles.coldZones}>
            {COLD_ZONES.slice(0, 3).map(z => {
              const active = isActive && elapsed >= z.from && elapsed < z.to
              return (
                <div
                  key={z.label}
                  className={`${styles.coldZone} ${active ? styles.coldZoneActive : ''}`}
                  style={active ? { borderColor: z.color, background: `${z.color}10` } : {}}
                >
                  <span className={styles.coldZoneMarker} style={{ background: z.color }} />
                  <div>
                    <span className={styles.coldZoneLabel} style={active ? { color: z.color } : {}}>
                      {z.label}
                    </span>
                    <span className={styles.coldZoneTime}>{z.from}–{z.to}s</span>
                  </div>
                </div>
              )
            })}
          </div>
          <p className={styles.coldGuideNote}>
            Load product cold, then heat. Stop when you reach your desired zone.
          </p>
        </div>
      )}
    </div>
  )
}
