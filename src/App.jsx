import { useState, useRef } from 'react'
import { AppProvider, useApp }    from './context/AppContext.jsx'
import { DataProvider }           from './context/DataContext.jsx'
import { Sidebar }                from './components/layout/Sidebar.jsx'
import { Topbar }                 from './components/layout/Topbar.jsx'
import { ToastContainer }         from './components/ui/Toast.jsx'
import { Dashboard }              from './components/dashboard/Dashboard.jsx'
import { Equipment }              from './components/equipment/Equipment.jsx'
import { Checkout }               from './components/checkout/Checkout.jsx'
import { Checkin }                from './components/checkin/Checkin.jsx'
import { Repairs }                from './components/repairs/Repairs.jsx'
import { CalendarPage }           from './components/calendar/Calendar.jsx'
import { Borrowers }              from './components/borrowers/Borrowers.jsx'
import { Reports }                from './components/reports/Reports.jsx'

const PAGE_META = {
  dashboard: { title: 'Dashboard',       sub: null,                         search: false, cta: null            },
  equipment: { title: 'Equipment',        sub: 'Full inventory register',    search: true,  cta: 'Add Equipment' },
  checkout:  { title: 'Check-Out',        sub: 'Issue equipment to borrowers',search: false, cta: null           },
  checkin:   { title: 'Check-In',         sub: 'Record and process returns', search: false, cta: null            },
  repairs:   { title: 'Repairs',          sub: 'Track and resolve repair tickets', search: false, cta: 'Log Repair' },
  calendar:  { title: 'Calendar',         sub: 'Events and packing lists',   search: false, cta: 'Add Event'     },
  borrowers: { title: 'Players & Staff',  sub: 'Borrower profiles',          search: true,  cta: 'Add Profile'   },
  reports:   { title: 'Reports',          sub: 'Analytics and summaries',    search: false, cta: null            },
}

function Shell() {
  const { config } = useApp()
  const [page,        setPage]        = useState('dashboard')
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const ctaRef = useRef(null)

  const navigate = (to) => { setPage(to); setSearchValue(''); setMobileOpen(false) }

  const meta  = PAGE_META[page] || PAGE_META.dashboard
  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const registerCta = (fn) => { ctaRef.current = fn }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard   onNavigate={navigate} />
      case 'equipment': return <Equipment   onNavigate={navigate} searchValue={searchValue} onRegisterCta={registerCta} />
      case 'checkout':  return <Checkout    onNavigate={navigate} onRegisterCta={registerCta} />
      case 'checkin':   return <Checkin     onNavigate={navigate} />
      case 'repairs':   return <Repairs     onNavigate={navigate} onRegisterCta={registerCta} />
      case 'calendar':  return <CalendarPage onNavigate={navigate} onRegisterCta={registerCta} />
      case 'borrowers': return <Borrowers   onNavigate={navigate} searchValue={searchValue} onRegisterCta={registerCta} />
      case 'reports':   return <Reports     onNavigate={navigate} />
      default:          return <Dashboard   onNavigate={navigate} />
    }
  }

  return (
    <div className="shell">
      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar
          title={meta.title}
          sub={meta.sub || today}
          onMenuClick={() => setMobileOpen(o => !o)}
          showSearch={meta.search}
          searchValue={searchValue}
          onSearch={setSearchValue}
          ctaLabel={meta.cta}
          onCta={() => ctaRef.current?.()}
        />
        <main style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '22px', background: 'var(--bg)',
        }}>
          {renderPage()}
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <DataProvider>
        <Shell />
      </DataProvider>
    </AppProvider>
  )
}
