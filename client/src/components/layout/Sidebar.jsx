import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Leaf,
  BarChart2,
  Sparkles,
  Timer,
  ClipboardList,
  Target,
  User,
} from 'lucide-react'
import styles from './Sidebar.module.css'

const NAV = [
  { to: '/dashboard',    label: 'Overview',      Icon: LayoutDashboard },
  { to: '/journal',      label: 'Journal',        Icon: BookOpen },
  { to: '/products',     label: 'Products',       Icon: FlaskConical },
  { to: '/strains',     label: 'Strains',        Icon: Leaf },
  { to: '/analytics',   label: 'Analytics',      Icon: BarChart2 },
  { to: '/recommend',   label: 'For You',        Icon: Sparkles },
  { to: '/dab-timer',   label: 'Dab Timer',      Icon: Timer },
  { to: '/log',         label: 'Log',            Icon: ClipboardList },
  { to: '/goals',       label: 'Goals',          Icon: Target },
]

export function Sidebar() {
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
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            [styles.navItem, isActive ? styles.active : ''].join(' ')
          }
        >
          <User size={15} strokeWidth={1.5} aria-hidden="true" />
          <span>Profile</span>
        </NavLink>
      </div>
    </aside>
  )
}
