import { useMemo, useState } from 'react'
import styles from './TrendLine.module.css'

const W = 480
const H = 120
const PAD = { top: 12, right: 16, bottom: 32, left: 28 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top  - PAD.bottom

/**
 * SVG line chart for rating trend over time.
 * data: [{ period: string, avgRating: number, count: number }]
 * yMin/yMax: domain (default 1-5)
 */
export function TrendLine({ data = [], yMin = 1, yMax = 5 }) {
  const [hovered, setHovered] = useState(null)

  const points = useMemo(() => {
    if (!data.length) return []
    return data.map((d, i) => ({
      ...d,
      x: PAD.left + (i / Math.max(data.length - 1, 1)) * INNER_W,
      y: PAD.top  + (1 - (d.avgRating - yMin) / (yMax - yMin)) * INNER_H,
    }))
  }, [data, yMin, yMax])

  if (!points.length) {
    return <p className={styles.empty}>No rating data</p>
  }

  // Build smooth SVG path using cubic bezier
  function pathD(pts) {
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const cp1x = (pts[i].x + pts[i + 1].x) / 2
      const cp1y = pts[i].y
      const cp2x = (pts[i].x + pts[i + 1].x) / 2
      const cp2y = pts[i + 1].y
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i + 1].x} ${pts[i + 1].y}`
    }
    return d
  }

  // Area under line
  function areaD(pts) {
    const baseY = PAD.top + INNER_H
    return pathD(pts) + ` L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`
  }

  // Y-axis grid lines at 1, 2, 3, 4, 5
  const gridY = [1, 2, 3, 4, 5].map(v => ({
    v,
    y: PAD.top + (1 - (v - yMin) / (yMax - yMin)) * INNER_H,
  }))

  // X labels: show max 6 evenly spaced
  const xLabels = useMemo(() => {
    if (points.length <= 6) return points
    const step = Math.floor(points.length / 5)
    return points.filter((_, i) => i % step === 0 || i === points.length - 1)
  }, [points])

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridY.map(({ v, y }) => (
          <g key={v}>
            <line
              x1={PAD.left} y1={y}
              x2={W - PAD.right} y2={y}
              className={styles.gridLine}
            />
            <text x={PAD.left - 4} y={y + 3.5} className={styles.yLabel}>{v}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD(points)} className={styles.area} />

        {/* Line */}
        <path d={pathD(points)} className={styles.line} />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hovered === i ? 4 : 3}
            className={styles.dot}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Hover tooltip */}
        {hovered !== null && (() => {
          const p = points[hovered]
          const tx = Math.min(Math.max(p.x - 40, PAD.left), W - PAD.right - 80)
          return (
            <g>
              <rect x={tx} y={p.y - 28} width={80} height={18} rx={3} className={styles.tooltipBg} />
              <text x={tx + 40} y={p.y - 15} textAnchor="middle" className={styles.tooltipText}>
                ★{p.avgRating} · {p.count} entries
              </text>
            </g>
          )
        })()}

        {/* X labels */}
        {xLabels.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={H - PAD.bottom + 14}
            textAnchor="middle"
            className={styles.xLabel}
          >
            {p.period.length > 7 ? p.period.slice(5) : p.period}
          </text>
        ))}
      </svg>
    </div>
  )
}
