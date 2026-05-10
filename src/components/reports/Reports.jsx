import { useState } from 'react'
import { Package, ArrowRightLeft, Wrench, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react'
import { Badge }     from '../ui/Badge.jsx'
import { StatCard }  from '../ui/StatCard.jsx'
import { useData }   from '../../context/DataContext.jsx'
import { fmt, fmtDateTime, daysUntil, dueBadgeProps } from '../../utils/date.js'
import { catStyle, STATUS_BADGE, CONDITION_BADGE, REPAIR_STATUS_BADGE } from '../../utils/constants.js'
import s from './Reports.module.css'

const TABS = ['Overview', 'Borrow History', 'Repairs']

export function Reports() {
  const { equipment, checkouts, repairs, borrowers } = useData()
  const [tab, setTab] = useState('Overview')

  // ── Aggregates ───────────────────────────────────────────
  const totalItems   = equipment.reduce((a, e) => a + e.total, 0)
  const totalAvail   = equipment.reduce((a, e) => a + e.available, 0)
  const activeOut    = checkouts.filter(c => c.status === 'Active' || c.status === 'Partial')
  const totalOut     = activeOut.reduce((a, c) => a + c.qty, 0)
  const openRepairs  = repairs.filter(r => r.status === 'Pending' || r.status === 'In Progress').length
  const overdueList  = checkouts.filter(c => (c.status === 'Active' || c.status === 'Partial') && daysUntil(c.dueDate) < 0)

  // Category breakdown
  const cats = [...new Set(equipment.map(e => e.category))].sort()
  const catRows = cats.map(cat => {
    const items  = equipment.filter(e => e.category === cat)
    const total  = items.reduce((a, e) => a + e.total, 0)
    const avail  = items.reduce((a, e) => a + e.available, 0)
    const out    = total - avail
    const pct    = total > 0 ? Math.round(avail / total * 100) : 0
    return { cat, total, avail, out, pct }
  })

  // Most borrowed
  const borrowCounts = {}
  checkouts.forEach(c => {
    borrowCounts[c.equipmentName] = (borrowCounts[c.equipmentName] || 0) + 1
  })
  const topBorrowed = Object.entries(borrowCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))
  const maxBorrow = topBorrowed[0]?.count || 1

  // Full borrow history sorted newest first
  const history = [...checkouts].sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))

  // Repair summary
  const repairRows = [...repairs].sort((a, b) => new Date(b.loggedDate) - new Date(a.loggedDate))

  return (
    <div>
      {/* Stat cards */}
      <div className={s.statsGrid}>
        <StatCard icon={<Package />}        value={totalItems}        label="Total Items"    sub={`${equipment.length} types`}                      variant="s-brand"  />
        <StatCard icon={<TrendingUp />}     value={totalAvail}        label="In Store"       sub="Available now"                                    variant="s-ok"     />
        <StatCard icon={<ArrowRightLeft />} value={totalOut}          label="Checked Out"    sub={`${activeOut.length} active loans`}               variant="s-info"   />
        <StatCard icon={<Wrench />}         value={openRepairs}       label="Open Repairs"   sub={`${repairs.length} total tickets`}                variant="s-warn"   />
        <StatCard icon={<AlertTriangle />}  value={overdueList.length} label="Overdue"       sub={overdueList.length > 0 ? 'Needs attention' : 'All on time'} variant={overdueList.length > 0 ? 's-danger' : 's-ok'} />
      </div>

      {/* Tab bar */}
      <div className={s.tabBar}>
        {TABS.map(t => (
          <button
            key={t}
            className={`${s.tabBtn} ${tab === t ? s.tabBtnActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'Overview' && (
        <div className={s.overviewGrid}>

          {/* Category breakdown */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Inventory by Category</div>
              <div className="card-sub" style={{ marginTop: 0, fontSize: 11, color: 'var(--text-3)' }}>
                Available vs total per sport
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Out</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {catRows.map(({ cat, total, avail, out, pct }) => {
                    const cs = catStyle(cat)
                    return (
                      <tr key={cat}>
                        <td>
                          <span className={s.catChip} style={{ background: cs.bg, color: cs.text }}>
                            {cat}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{total}</td>
                        <td style={{ color: 'var(--ok)', fontWeight: 600 }}>{avail}</td>
                        <td style={{ color: out > 0 ? 'var(--info)' : 'var(--text-3)' }}>{out}</td>
                        <td style={{ minWidth: 120 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="prog-wrap" style={{ flex: 1 }}>
                              <div
                                className="prog-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: pct > 60 ? 'var(--ok)' : pct > 30 ? 'var(--warn)' : 'var(--danger)',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, width: 30, flexShrink: 0 }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className={s.rightCol}>
            {/* Overdue */}
            {overdueList.length > 0 && (
              <div className="card mb-3">
                <div className="card-head">
                  <div className="card-title">Overdue Returns</div>
                  <Badge className="badge-danger">{overdueList.length}</Badge>
                </div>
                {overdueList.map(co => (
                  <div key={co.id} className={s.overdueRow}>
                    <div className={s.overdueEquip}>{co.equipmentName}</div>
                    <div className={s.overdueMeta}>
                      {co.borrowerName} · {co.idNumber}
                    </div>
                    <div className={s.overdueMeta}>
                      {co.team} · ×{co.qty}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Due: {fmt(co.dueDate)}</span>
                      <Badge className="badge-danger">
                        Overdue {Math.abs(daysUntil(co.dueDate))}d
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Most borrowed */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Most Borrowed</div>
                <div className="card-sub" style={{ marginTop: 0, fontSize: 11, color: 'var(--text-3)' }}>
                  All time
                </div>
              </div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {topBorrowed.length === 0
                  ? <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>No borrow history yet.</div>
                  : topBorrowed.map(({ name, count }) => (
                    <div key={name} className={s.popularRow}>
                      <div className={s.popularName}>{name}</div>
                      <div className={s.popularBar}>
                        <div
                          className={s.popularBarFill}
                          style={{ width: `${Math.round(count / maxBorrow * 100)}%` }}
                        />
                      </div>
                      <div className={s.popularCount}>{count}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BORROW HISTORY TAB ── */}
      {tab === 'Borrow History' && (
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Borrower</th>
                  <th>ID Number</th>
                  <th>Team</th>
                  <th>Qty</th>
                  <th>Issued At</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Returned At</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px' }}>
                        No borrow history yet.
                      </td>
                    </tr>
                  )
                  : history.map(co => {
                    const returnedAt = co.returnLines?.[0]?.returnedAt
                    const { label, cls } = dueBadgeProps(co.dueDate, co.status === 'Returned')
                    return (
                      <tr key={co.id}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{co.equipmentName}</td>
                        <td style={{ fontSize: 12 }}>{co.borrowerName}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-3)' }}>{co.idNumber}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-2)' }}>{co.team || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{co.qty}</td>
                        <td style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                          {fmtDateTime(co.issuedAt)}
                        </td>
                        <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(co.dueDate)}</td>
                        <td><Badge className={cls}>{label}</Badge></td>
                        <td style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                          {returnedAt ? fmtDateTime(returnedAt) : '—'}
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPAIRS TAB ── */}
      {tab === 'Repairs' && (
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Problem</th>
                  <th>Status</th>
                  <th>Logged At</th>
                  <th>Resolved At</th>
                </tr>
              </thead>
              <tbody>
                {repairRows.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px' }}>
                        No repair tickets yet.
                      </td>
                    </tr>
                  )
                  : repairRows.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{r.equipmentName}</td>
                      <td
                        style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 260 }}
                        className="truncate"
                        title={r.problem}
                      >
                        {r.problem}
                      </td>
                      <td>
                        <Badge className={REPAIR_STATUS_BADGE[r.status] || 'badge-neutral'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {fmtDateTime(r.loggedDate)}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {r.resolvedDate ? fmtDateTime(r.resolvedDate) : '—'}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
