import { Moon, Sun, Package, LayoutDashboard, ArrowRightLeft, ArrowLeftRight, Wrench, CalendarDays, Users, BarChart3, Home, LogOut } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useData } from '../../context/DataContext.jsx'
import s from './Sidebar.module.css'

const NAV = [
  { group: 'Overview' },
  { id: 'dashboard',  label: 'Dashboard',       icon: LayoutDashboard },
  { group: 'Inventory' },
  { id: 'equipment',  label: 'Equipment',        icon: Package },
  { group: 'Operations' },
  { id: 'checkout',   label: 'Check-Out',        icon: ArrowRightLeft },
  { id: 'checkin',    label: 'Check-In',         icon: ArrowLeftRight },
  { id: 'repairs',    label: 'Repairs',          icon: Wrench,  badge: true },
  { group: 'Planning' },
  { id: 'calendar',   label: 'Calendar',         icon: CalendarDays },
  { group: 'Insights' },
  { id: 'borrowers',  label: 'Players & Staff',  icon: Users },
  { id: 'reports',    label: 'Reports',          icon: BarChart3 },
]

export function Sidebar({ currentPage, onNavigate, mobileOpen, onCloseMobile, onSignOut, userEmail }) {
  const { theme, toggleTheme, config } = useApp()
  const { repairs } = useData()
  const openRepairs = repairs.filter(r => r.status === 'Pending' || r.status === 'In Progress').length
  const isDark = theme === 'dark'

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'block',
          }}
        />
      )}

      <aside className={`${s.sidebar} ${mobileOpen ? s.mobileOpen : ''}`}>

        {/* KitFlow brand */}
        <div className={s.brand}>
          <svg className={s.logoMark} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17 2L4 7.5V16C4 22.5 9.5 28.5 17 31C24.5 28.5 30 22.5 30 16V7.5L17 2Z"
              fill="var(--brand)" fillOpacity="0.15"
              stroke="var(--brand)" strokeWidth="1.5" strokeLinejoin="round"
            />
            <path
              d="M10 17L14.5 21.5L24 12"
              stroke="var(--brand)" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"
            />
            <circle cx="10" cy="17" r="1.5" fill="var(--brand)" fillOpacity="0.6" />
            <circle cx="17" cy="10" r="1.2" fill="var(--brand)" fillOpacity="0.35" />
          </svg>
          <div className={s.brandText}>
            <div className={s.brandName}>Kit<span>Flow</span></div>
            <div className={s.brandTagline}>Equipment Management</div>
          </div>
        </div>

        {/* Client branding slot */}
        <div className={s.clientSlot}>
          <div className={s.clientLogoBox}>
            {config.clientLogoUrl
              ? <img src={config.clientLogoUrl} alt="Logo" />
              : <Home size={14} color="var(--text-3)" />
            }
          </div>
          <div>
            <div className={s.clientName}>{config.clientName}</div>
            <div className={s.clientSub}>{config.clientSub}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={s.navScroll}>
          {NAV.map((item, i) => {
            if (item.group) {
              return (
                <div key={`g-${i}`} className={s.groupTitle}>
                  {item.group}
                </div>
              )
            }
            if (!config.features[item.id] && item.id !== 'dashboard') return null
            const Icon = item.icon
            const badgeCount = item.badge ? openRepairs : 0
            return (
              <button
                key={item.id}
                className={`${s.navItem} ${currentPage === item.id ? s.active : ''}`}
                onClick={() => { onNavigate(item.id); onCloseMobile?.() }}
              >
                <span className={s.navIcon}><Icon size={17} /></span>
                <span className={s.navLabel}>{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`${s.navBadge} ${s.warn}`}>{badgeCount}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer: user info + sign-out + theme toggle */}
        <div className={s.footer}>
          {userEmail && (
            <div className={s.userRow}>
              <div className={s.userAvatar}>
                {userEmail[0].toUpperCase()}
              </div>
              <div className={s.userInfo}>
                <div className={s.userEmail}>{userEmail}</div>
              </div>
              {onSignOut && (
                <button className={s.signOutBtn} onClick={onSignOut} title="Sign out">
                  <LogOut size={14} />
                </button>
              )}
            </div>
          )}
          <button className={s.themeBtn} onClick={toggleTheme}>
            <span className={s.navIcon}>
              {isDark ? <Moon size={15} /> : <Sun size={15} />}
            </span>
            <span className={s.themeLabel}>{isDark ? 'Dark mode' : 'Light mode'}</span>
            <div className={`${s.themePill} ${isDark ? '' : s.on}`} />
          </button>
        </div>

      </aside>
    </>
  )
}
