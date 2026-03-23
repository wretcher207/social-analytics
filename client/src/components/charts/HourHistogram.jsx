import { useState } from 'react'
import styles from './HourHistogram.module.css'

const HOUR_LABELS = {
  0:  '12a', 3: '3a', 6: '6a', 9: '9a',
  12: '12p', 15: '3p', 18: '6p', 21: '9p', 23: '11p',
}

/**
 * 24-hour vertical bar histogram.
 * data: [{ hour: 0..23, count }]
 */
export function HourHistogram({ data = [] }) {
  const [hovered, setHovered] = useState(null)

  if (!data.length) return null

  const max = Math.max(...data.map(d => d.count), 1)
  const CHART_H = 64   // bar area height px

  return (
    <div className={styles.root}>
      <div className={styles.chart}>
        {data.map(({ hour, count }) => {
          const barH = Math.round((count / max) * CHART_H)
          return (
            <div
              key={hour}
              className={styles.col}
              onMouseEnter={() => setHovered(hour)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === hour && count > 0 && (
                <span className={styles.tooltip}>{count}</span>
              )}
              <div
                className={[styles.bar, count === 0 ? styles.barEmpty : ''].join(' ')}
                style={{ height: Math.max(barH, count > 0 ? 2 : 0) }}
              />
              {HOUR_LABELS[hour] !== undefined && (
                <span className={styles.label}>{HOUR_LABELS[hour]}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
