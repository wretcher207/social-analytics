import { useMemo, useState } from 'react'
import styles from './CalendarHeatmap.module.css'

const DAYS    = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CELL    = 11   // cell size px
const GAP     = 2    // gap px
const STEP    = CELL + GAP

/** Color intensity bucket: returns CSS class name suffix 0..4 */
function intensity(count) {
  if (!count)    return 0
  if (count < 2) return 1
  if (count < 4) return 2
  if (count < 7) return 3
  return 4
}

/**
 * CalendarHeatmap
 * data: [{date: 'YYYY-MM-DD', count}]
 * weeks: number of weeks to show (default 52)
 */
export function CalendarHeatmap({ data = [], weeks = 52 }) {
  const [tooltip, setTooltip] = useState(null)   // { date, count, x, y }

  // Build a date→count map
  const countMap = useMemo(() => {
    const m = {}
    data.forEach(({ date, count }) => { m[date] = count })
    return m
  }, [data])

  // Build grid: array of weeks, each week is array of 7 day objects
  const { grid, monthLabels } = useMemo(() => {
    const today     = new Date()
    // Start on Sunday, `weeks` weeks ago
    const start     = new Date(today)
    start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7)

    const g     = []
    const mSeen = new Set()
    const mLbls = []

    for (let w = 0; w < weeks; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start)
        dt.setDate(start.getDate() + w * 7 + d)
        const dateStr = dt.toISOString().slice(0, 10)
        const month   = dt.getMonth()
        const key     = `${dt.getFullYear()}-${month}`
        if (!mSeen.has(key) && dt.getDate() <= 7) {
          mSeen.add(key)
          mLbls.push({ week: w, label: MONTHS[month] })
        }
        week.push({ date: dateStr, count: countMap[dateStr] ?? 0 })
      }
      g.push(week)
    }

    return { grid: g, monthLabels: mLbls }
  }, [countMap, weeks])

  const svgW = weeks * STEP + 24     // extra for day labels
  const svgH = 7 * STEP + 20         // extra for month labels

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
      >
        {/* Month labels */}
        {monthLabels.map(({ week, label }) => (
          <text
            key={`${week}-${label}`}
            x={24 + week * STEP}
            y={10}
            className={styles.monthLabel}
          >
            {label}
          </text>
        ))}

        {/* Day-of-week labels */}
        {[1, 3, 5].map(d => (
          <text
            key={d}
            x={14}
            y={20 + d * STEP + CELL * 0.75}
            className={styles.dayLabel}
          >
            {DAYS[d]}
          </text>
        ))}

        {/* Cells */}
        {grid.map((week, wi) =>
          week.map((day, di) => (
            <rect
              key={day.date}
              x={24 + wi * STEP}
              y={20 + di * STEP}
              width={CELL}
              height={CELL}
              rx={2}
              className={styles[`level${intensity(day.count)}`]}
              onMouseEnter={e => {
                const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                setTooltip({
                  date:  day.date,
                  count: day.count,
                  x:     e.clientX - rect.left,
                  y:     e.clientY - rect.top,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))
        )}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={Math.min(tooltip.x + 6, svgW - 110)}
              y={tooltip.y - 28}
              width={102}
              height={20}
              rx={4}
              className={styles.tooltipBg}
            />
            <text
              x={Math.min(tooltip.x + 57, svgW - 55)}
              y={tooltip.y - 14}
              textAnchor="middle"
              className={styles.tooltipText}
            >
              {tooltip.date} · {tooltip.count} session{tooltip.count !== 1 ? 's' : ''}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        {[0, 1, 2, 3, 4].map(l => (
          <svg key={l} width={CELL} height={CELL}>
            <rect
              x={0} y={0}
              width={CELL} height={CELL}
              rx={2}
              className={styles[`level${l}`]}
            />
          </svg>
        ))}
        <span className={styles.legendLabel}>More</span>
      </div>
    </div>
  )
}
