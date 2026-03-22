import { useAuth } from '@/hooks/useAuth'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Overview</h1>
          <p className={styles.sub}>Your terpene intelligence dashboard</p>
        </div>
        <span className={styles.email}>{user?.email}</span>
      </header>

      <div className={styles.placeholder}>
        <p className="label-caps">Phase 2 — Database schema coming next</p>
        <p>Journal entries, product catalog, and consumption log will appear here.</p>
      </div>
    </div>
  )
}
