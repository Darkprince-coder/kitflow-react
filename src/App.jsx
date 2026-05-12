import { useState, useRef } from 'react'
import { AppProvider, useApp }    from './context/AppContext.jsx'
import { AuthProvider, useAuth }  from './context/AuthContext.jsx'
import { DataProvider }           from './context/DataContext.jsx'
import { Sidebar }                from './components/layout/Sidebar.jsx'
import { Topbar }                 from './components/layout/Topbar.jsx'
import { ToastContainer }         from './components/ui/Toast.jsx'
import { Login }                  from './components/auth/Login.jsx'
import { Dashboard }              from './components/dashboard/Dashboard.jsx'
import { Equipment }              from './components/equipment/Equipment.jsx'
import { Checkout }               from './components/checkout/Checkout.jsx'
import { Checkin }                from './components/checkin/Checkin.jsx'
import { Repairs }                from './components/repairs/Repairs.jsx'
import { CalendarPage }           from './components/calendar/Calendar.jsx'
import { Borrowers }              from './components/borrowers/Borrowers.jsx'
import { Reports }                from './components/reports/Reports.jsx'
import { Settings }               from './components/settings/Settings.jsx'
import { InstallPrompt }          from './components/pwa/InstallPrompt.jsx'

const PAGE_META = {
  dashboard: { title: 'Dashboard',      sub: null,                           search: false, cta: null            },
  equipment: { title: 'Equipment',       sub: 'Full inventory register',      search: true,  cta: 'Add Equipment' },
  checkout:  { title: 'Check-Out',       sub: 'Issue equipment to borrowers', search: false, cta: null            },
  checkin:   { title: 'Check-In',        sub: 'Record and process returns',   search: false, cta: null            },
  repairs:   { title: 'Repairs',         sub: 'Track and resolve tickets',    search: false, cta: 'Log Repair'    },
  calendar:  { title: 'Calendar',        sub: 'Events and packing lists',     search: false, cta: 'Add Event'     },
  borrowers: { title: 'Players & Staff', sub: 'Borrower profiles',            search: true,  cta: 'Add Profile'   },
  reports:   { title: 'Reports',         sub: 'Analytics and summaries',      search: false, cta: null            },
  settings:  { title: 'Settings',        sub: 'Roles, categories, account',   search: false, cta: null            },
}

function Splash() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 16,
    }}>
      <svg width="40" height="40" viewBox="0 0 34 34" fill="none">
        <path d="M17 2L4 7.5V16C4 22.5 9.5 28.5 17 31C24.5 28.5 30 22.5 30 16V7.5L17 2Z"
          fill="var(--brand)" fillOpacity="0.15" stroke="var(--brand)" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M10 17L14.5 21.5L24 12" stroke="var(--brand)" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ width:32, height:3, borderRadius:2, background:'var(--surface-3)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:'60%', background:'var(--brand)', borderRadius:2, animation:'slideBar 1.2s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes slideBar{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
    </div>
  )
}

function Shell() {
  const { config }                         = useApp()
  const { signOut, session, isConfigured } = useAuth()
  const [page,       setPage]       = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search,     setSearch]     = useState('')
  const ctaRef = useRef(null)

  const navigate = (to) => { setPage(to); setSearch(''); setMobileOpen(false) }
  const meta  = PAGE_META[page] || PAGE_META.dashboard
  const today = new Date().toLocaleDateString('en-KE', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard    onNavigate={navigate} />
      case 'equipment': return <Equipment    onNavigate={navigate} searchValue={search} onRegisterCta={fn => { ctaRef.current = fn }} />
      case 'checkout':  return <Checkout     onNavigate={navigate} onRegisterCta={fn => { ctaRef.current = fn }} />
      case 'checkin':   return <Checkin      onNavigate={navigate} />
      case 'repairs':   return <Repairs      onNavigate={navigate} onRegisterCta={fn => { ctaRef.current = fn }} />
      case 'calendar':  return <CalendarPage onNavigate={navigate} onRegisterCta={fn => { ctaRef.current = fn }} />
      case 'borrowers': return <Borrowers    onNavigate={navigate} searchValue={search} onRegisterCta={fn => { ctaRef.current = fn }} />
      case 'reports':   return <Reports      onNavigate={navigate} />
      case 'settings':  return <Settings />
      default:          return <Dashboard    onNavigate={navigate} />
    }
  }

  return (
    <div className="shell">
      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onSignOut={isConfigured ? signOut : null}
        userEmail={session?.user?.email || null}
      />
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar
          title={meta.title}
          sub={meta.sub || today}
          onMenuClick={() => setMobileOpen(o => !o)}
          showSearch={meta.search}
          searchValue={search}
          onSearch={setSearch}
          ctaLabel={meta.cta}
          onCta={() => ctaRef.current?.()}
        />
        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'22px', background:'var(--bg)' }}>
          {renderPage()}
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}

function Root() {
  const { isAuthenticated, loading } = useAuth()
  if (loading)          return <Splash />
  if (!isAuthenticated) return <Login />
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <Root />
        <InstallPrompt />
      </AuthProvider>
    </AppProvider>
  )
}
