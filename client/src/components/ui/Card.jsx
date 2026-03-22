import styles from './Card.module.css'

export function Card({ children, className = '', elevated = false, onClick, ...rest }) {
  return (
    <div
      className={[styles.card, elevated ? styles.elevated : '', onClick ? styles.clickable : '', className].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return <div className={[styles.header, className].join(' ')}>{children}</div>
}

export function CardBody({ children, className = '' }) {
  return <div className={[styles.body, className].join(' ')}>{children}</div>
}
