import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  BarChart2,
  Sparkles,
  Timer,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import styles from './Sidebar.module.css'

const NAV = [
  { to: '/dashboard',    label: 'Overview',      Icon: LayoutDashboard },
  { to: '/journal',      label: 'Journal',        Icon: BookOpen },
  { to: '/products',     label: 'Products',       Icon: FlaskConical },
  { to: '/analytics',   label: 'Analytics',      Icon: BarChart2 },
  { to: '/recommend',   label: 'For You',        Icon: Sparkles },
  { to: '/dab-timer',   label: 'Dab Timer',      Icon: Timer },
]

export function Sidebar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.wordmark}>TERP</div>

      <nav className={styles.nav} aria-label="Primary navigation">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.active : ''].join(' ')
            }
          >
            <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <button className={styles.signOut} onClick={handleSignOut}>
          <LogOut size={14} strokeWidth={1.5} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
