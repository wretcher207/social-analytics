import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { QuickLogFAB } from '@/components/quicklog/QuickLogFAB'
import styles from './AppShell.module.css'

export function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <QuickLogFAB />
    </div>
  )
}
