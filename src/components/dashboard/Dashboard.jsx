import { Package, CheckSquare, ArrowRightLeft, Wrench, AlertCircle, TrendingUp } from 'lucide-react'
import { StatCard } from '../ui/StatCard.jsx'
import { Badge } from '../ui/Badge.jsx'
import { useData } from '../../context/DataContext.jsx'
import { fmt, fmtShort, daysUntil, timeAgo } from '../../utils/date.js'
import { catStyle, EVENT_TYPE_BADGE } from '../../utils/constants.js'
import s from './Dashboard.module.css'

export function Dashboard({ onNavigate }) {
  const { equipment, checkouts, repairs, events, activity } = useData()

  const totalItems    = equipment.reduce((a, e) => a + e.total, 0)
  const totalAvail    = equipment.reduce((a, e) => a + e.available, 0)
  const activeOut     = checkouts.filter(c => c.status === 'Active').reduce((a, c) => a + c.qty, 0)
  const openRepairs   = repairs.filter(r => r.status === 'Pending' || r.status === 'In Progress').length
  const overdueCount  = checkouts.filter(c => c.status === 'Active' && daysUntil(c.dueDate) < 0).length
  const lowStock      = equipment.filter(e => e.available <= e.minStock && e.status !== 'Under Repair')

  const upcoming = [...events]
    .filter(e => daysUntil(e.date) >= 0)
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
    .slice(0, 5)

  const overdue = checkouts.filter(c => c.status === 'Active' && daysUntil(c.dueDate) < 0)

  // Category breakdown
  const cats = [...new Set(equipment.map(e => e.category))]
  const catData = cats.map(cat => {
    const items = equipment.filter(e => e.category === cat)
    const total   = items.reduce((a, e) => a + e.total, 0)
    const avail   = items.reduce((a, e) => a + e.available, 0)
    const out     = total - avail
    return { cat, total, avail, out, pct: total > 0 ? Math.round(avail / total * 100) : 0 }
  }).sort((a, b) => b.total - a.total)

  const ACTIVITY_COLORS = { ok: 'var(--ok)', warn: 'var(--warn)', info: 'var(--brand)', danger: 'var(--danger)', brand: 'var(--brand)' }

  return (
    <div>
      {/* Stat cards */}
      <div className={s.statsGrid}>
        <StatCard icon={<Package />}       value={totalItems}   label="Total Items"    sub={`${equipment.length} types`}                    variant="s-brand"  />
        <StatCard icon={<CheckSquare />}   value={totalAvail}   label="In Store"       sub="Ready to issue"                                 variant="s-ok"     />
        <StatCard icon={<ArrowRightLeft />}value={activeOut}    label="Checked Out"    sub={`${checkouts.filter(c=>c.status==='Active').length} active`} variant="s-info"   />
        <StatCard icon={<Wrench />}        value={openRepairs}  label="Open Repairs"   sub={`${repairs.length} total tickets`}              variant="s-warn"   />
        <StatCard icon={<AlertCircle />}   value={overdueCount} label="Overdue"        sub={overdueCount > 0 ? 'Needs follow-up' : 'All on time'} variant={overdueCount > 0 ? 's-danger' : 's-ok'} />
      </div>

      {/* Alerts row */}
      {(overdue.length > 0 || lowStock.length > 0) && (
        <div className={s.alertsRow}>
          {overdue.map(co => (
            <div key={co.id} className="alert alert-danger">
              <AlertCircle size={15} />
              <div>
                <div className="alert-title">{co.equipmentName} — overdue {Math.abs(daysUntil(co.dueDate))} day(s)</div>
                <div className="alert-body">{co.borrowerName} · Team: {co.team} · Was due {fmt(co.dueDate)}</div>
              </div>
            </div>
          ))}
          {lowStock.slice(0, 3).map(e => (
            <div key={e.id} className={`alert ${e.available === 0 ? 'alert-danger' : 'alert-warn'}`}>
              <AlertCircle size={15} />
              <div>
                <div className="alert-title">Low stock — {e.name}</div>
                <div className="alert-body">{e.available} of {e.total} available · Min threshold: {e.minStock}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Middle row */}
      <div className={s.midRow}>
        {/* Activity feed */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Recent Activity</div>
              <div className="card-sub">Latest operations</div>
            </div>
          </div>
          {activity.length === 0
            ? <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>No activity yet</div>
            : activity.slice(0, 8).map(a => (
              <div key={a.id} className={s.feedItem}>
                <div className={s.feedDot} style={{ background: ACTIVITY_COLORS[a.color] || 'var(--brand)' }} />
                <div className={s.feedBody}>
                  <div className={s.feedText}>{a.text}</div>
                  {a.detail && <div className={s.feedMeta}>{a.detail}</div>}
                </div>
                <div className={s.feedTime}>{timeAgo(a.time)}</div>
              </div>
            ))
          }
        </div>

        {/* Upcoming events */}
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Upcoming Events</div>
              <div className="card-sub">Next 14 days</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('calendar')}>
              View all
            </button>
          </div>
          {upcoming.length === 0
            ? <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>No upcoming events</div>
            : upcoming.map(ev => {
              const d = new Date(ev.date)
              const du = daysUntil(ev.date)
              const soon = du <= 3
              return (
                <div key={ev.id} className={s.eventItem} onClick={() => onNavigate('calendar')}>
                  <div className={`${s.dateChip} ${soon ? s.soon : ''}`}>
                    <span className={s.eventDay}>{d.getDate()}</span>
                    <span className={s.eventMon}>{d.toLocaleDateString('en', { month: 'short' })}</span>
                  </div>
                  <div className={s.eventInfo}>
                    <div className={s.eventName}>{ev.name}</div>
                    <div className={s.eventMeta}>
                      {ev.sport} · {ev.venue}
                      {du === 0 ? <span style={{ color: 'var(--warn)', fontWeight: 600 }}> · Today</span>
                        : du === 1 ? <span style={{ color: 'var(--warn)', fontWeight: 600 }}> · Tomorrow</span>
                        : <span> · in {du}d</span>}
                    </div>
                  </div>
                  <Badge className={EVENT_TYPE_BADGE[ev.type] || 'badge-neutral'}>{ev.type}</Badge>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card">
        <div className="card-head">
          <div className="card-title">Inventory by Category</div>
          <div className="card-sub" style={{ marginTop: 0, fontSize: 11, color: 'var(--text-3)' }}>Available vs total</div>
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          {catData.map(({ cat, total, avail, out, pct }) => {
            const cs = catStyle(cat)
            return (
              <div key={cat} className={s.catRow}>
                <div className={s.catLabel}>
                  <span
                    className={s.catChip}
                    style={{ background: cs.bg, color: cs.text }}
                  >{cat}</span>
                </div>
                <div className={s.catBarWrap}>
                  <div
                    className={s.catBarFill}
                    style={{
                      width: `${pct}%`,
                      background: pct > 60 ? 'var(--ok)' : pct > 30 ? 'var(--warn)' : 'var(--danger)'
                    }}
                  />
                </div>
                <div className={s.catStats}>
                  <span><span className={s.catStatVal}>{avail}</span> avail</span>
                  <span><span className={s.catStatVal}>{out}</span> out</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
