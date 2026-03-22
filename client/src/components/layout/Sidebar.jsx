import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Leaf,
  Droplets,
  BarChart2,
  Sparkles,
  Timer,
  ClipboardList,
  Target,
  Trophy,
  CalendarDays,
  Activity,
  Heart,
  User,
  Search,
  ShieldOff,
  FlaskRound,
} from 'lucide-react'
import styles from './Sidebar.module.css'

const NAV = [
  { to: '/dashboard',    label: 'Overview',      Icon: LayoutDashboard },
  { to: '/journal',      label: 'Journal',        Icon: BookOpen },
  { to: '/products',     label: 'Products',       Icon: FlaskConical },
  { to: '/strains',     label: 'Strains',        Icon: Leaf },
  { to: '/terpenes',   label: 'Terpenes',       Icon: Droplets },
  { to: '/analytics',   label: 'Analytics',      Icon: BarChart2 },
  { to: '/recommend',   label: 'For You',        Icon: Sparkles },
  { to: '/dab-timer',   label: 'Dab Timer',      Icon: Timer },
  { to: '/log',         label: 'Log',            Icon: ClipboardList },
  { to: '/goals',        label: 'Goals',        Icon: Target },
  { to: '/achievements', label: 'Achievements', Icon: Trophy },
  { to: '/calendar',     label: 'Calendar',     Icon: CalendarDays },
  { to: '/timeline',    label: 'Timeline',     Icon: Activity },
  { to: '/favorites',        label: 'Favorites',    Icon: Heart },
  { to: '/tolerance-break', label: 'T-Break',      Icon: ShieldOff },
  { to: '/dose-calc',       label: 'Dose Calc',    Icon: FlaskRound },
]

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.wordmark}>TERP</div>

      <NavLink
        to="/search"
        className={({ isActive }) =>
          [styles.searchLink, isActive ? styles.active : ''].join(' ')
        }
      >
        <Search size={13} strokeWidth={1.5} aria-hidden="true" />
        <span>Search</span>
      </NavLink>

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
