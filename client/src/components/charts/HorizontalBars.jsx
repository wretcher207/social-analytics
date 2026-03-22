import styles from './HorizontalBars.module.css'

/**
 * Horizontal bar chart.
 * items: [{ label, value, sublabel? }]
 * colorVar: CSS variable name for fill (default '--color-accent')
 */
export function HorizontalBars({
  items = [],
  colorVar = '--color-accent',
  maxValue,
  unit = '',
  emptyText = 'No data',
}) {
  if (!items.length) {
    return <p className={styles.empty}>{emptyText}</p>
  }

  const max = maxValue ?? Math.max(...items.map(i => i.value), 1)

  return (
    <div className={styles.root}>
      {items.map((item, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.label} title={item.label}>{item.label}</span>
          <div className={styles.track}>
            <div
              className={styles.fill}
              style={{
                width: `${(item.value / max) * 100}%`,
                background: `var(${colorVar})`,
              }}
            />
          </div>
          <span className={styles.value}>
            {item.value}{unit}
            {item.sublabel && (
              <span className={styles.sub}> {item.sublabel}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
