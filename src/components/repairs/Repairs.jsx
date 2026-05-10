import { useState } from 'react'
import { Wrench, Plus, CheckCircle, XCircle, RotateCcw, Clock } from 'lucide-react'
import { Modal }      from '../ui/Modal.jsx'
import { Badge }      from '../ui/Badge.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { useData }    from '../../context/DataContext.jsx'
import { useApp }     from '../../context/AppContext.jsx'
import { fmtDateTime } from '../../utils/date.js'
import { REPAIR_STATUS_BADGE, CONDITION_BADGE } from '../../utils/constants.js'
import s from './Repairs.module.css'

const EMPTY_FORM = { equipmentId: '', problem: '', status: 'Pending', notes: '' }

const STATUS_FLOW = ['Pending', 'In Progress', 'Repaired']

const STATUS_ACTIONS = {
  'Pending':        [
    { label: 'Start Repair',   next: 'In Progress',    cls: 'btn-warn',   icon: Wrench      },
    { label: 'Cannot Repair',  next: 'Not Repairable', cls: 'btn-danger', icon: XCircle     },
  ],
  'In Progress':    [
    { label: 'Mark Repaired',  next: 'Repaired',       cls: 'btn-ok',     icon: CheckCircle },
    { label: 'Cannot Repair',  next: 'Not Repairable', cls: 'btn-danger', icon: XCircle     },
  ],
  'Repaired':       [
    { label: 'Restore to Stock', next: '__restore__',  cls: 'btn-primary', icon: RotateCcw  },
  ],
  'Not Repairable': [],
  'Completed':      [],
}

export function Repairs({ onRegisterCta }) {
  const { equipment, repairs, addRepair, updateRepair } = useData()
  const { showToast } = useApp()

  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [errors,       setErrors]       = useState({})
  const [detailId,     setDetailId]     = useState(null)

  useState(() => {
    onRegisterCta?.(() => { setForm(EMPTY_FORM); setErrors({}); setModalOpen(true) })
  })

  const filtered = [...repairs]
    .filter(r => !statusFilter || r.status === statusFilter)
    .sort((a, b) => new Date(b.loggedDate) - new Date(a.loggedDate))

  const detailRepair = repairs.find(r => r.id === detailId)
  const detailEquip  = detailRepair
    ? equipment.find(e => e.id === detailRepair.equipmentId)
    : null

  const validate = () => {
    const e = {}
    if (!form.equipmentId)    e.equipmentId = 'Select equipment'
    if (!form.problem.trim()) e.problem     = 'Describe the problem'
    return e
  }

  const save = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const eq = equipment.find(e => e.id === Number(form.equipmentId))
    addRepair({
      equipmentId:   Number(form.equipmentId),
      equipmentName: eq?.name || '',
      problem:       form.problem.trim(),
      status:        form.status,
      notes:         form.notes.trim(),
    })
    showToast('ok', 'Repair ticket logged', eq?.name)
    setModalOpen(false)
    setForm(EMPTY_FORM)
  }

  const handleAction = (repair, next) => {
    if (next === '__restore__') {
      updateRepair(repair.id, { status: 'Completed', resolvedDate: new Date().toISOString() })
      showToast('ok', 'Restored to stock', repair.equipmentName)
      if (detailId === repair.id) setDetailId(null)
      return
    }
    updateRepair(repair.id, {
      status: next,
      resolvedDate: (next === 'Repaired' || next === 'Not Repairable')
        ? new Date().toISOString() : null,
    })
    showToast('ok', `Status → ${next}`, repair.equipmentName)
  }

  const setF = (field, val) => {
    setForm(p => ({ ...p, [field]: val }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const repairableEquip = equipment.filter(e => e.status !== 'Lost')
  const equipCats = [...new Set(repairableEquip.map(e => e.category))].sort()

  const countByStatus = (st) => repairs.filter(r => r.status === st).length

  return (
    <div className={s.layout}>

      {/* ══ LEFT — list ══ */}
      <div className={s.listCol}>

        <div className={s.filterBar}>
          <select
            className="form-select"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Repaired">Repaired</option>
            <option value="Not Repairable">Not Repairable</option>
            <option value="Completed">Completed</option>
          </select>

          <div className={s.quickPills}>
            {[
              { st: 'Pending',     dot: s.dotPending  },
              { st: 'In Progress', dot: s.dotProgress },
            ].map(({ st, dot }) => {
              const n = countByStatus(st)
              return n > 0 ? (
                <button
                  key={st}
                  className={`${s.pill} ${statusFilter === st ? s.pillActive : ''}`}
                  onClick={() => setStatusFilter(f => f === st ? '' : st)}
                >
                  <span className={`${s.pillDot} ${dot}`} />
                  {n} {st}
                </button>
              ) : null
            })}
          </div>

          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => { setForm(EMPTY_FORM); setErrors({}); setModalOpen(true) }}
          >
            <Plus size={14} /> Log Repair
          </button>
        </div>

        <div className="card">
          {filtered.length === 0
            ? <EmptyState
                icon={<Wrench size={28} />}
                title="No repair tickets"
                subtitle={statusFilter
                  ? `No tickets with status "${statusFilter}".`
                  : 'All equipment is in good shape.'}
              />
            : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Problem</th>
                      <th>Status</th>
                      <th>Logged</th>
                      <th>Resolved</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr
                        key={r.id}
                        className={detailId === r.id ? s.rowSelected : ''}
                        onClick={() => setDetailId(id => id === r.id ? null : r.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{r.equipmentName}</td>
                        <td
                          style={{ color: 'var(--text-2)', fontSize: 12, maxWidth: 200 }}
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
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            {(STATUS_ACTIONS[r.status] || []).map(action => {
                              const Icon = action.icon
                              return (
                                <button
                                  key={action.next}
                                  className={`btn ${action.cls} btn-sm`}
                                  onClick={() => handleAction(r, action.next)}
                                  title={action.label}
                                >
                                  <Icon size={12} />
                                  <span className={s.actionLabel}>{action.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>

      {/* ══ RIGHT — detail panel ══ */}
      <div className={s.detailCol}>
        {!detailRepair
          ? (
            <div className="card">
              <EmptyState
                icon={<Wrench size={28} />}
                title="Select a ticket"
                subtitle="Click any row to view full details and take action."
              />
            </div>
          )
          : (
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">{detailRepair.equipmentName}</div>
                  <div className="card-sub">Ticket {detailRepair.id}</div>
                </div>
                <Badge className={REPAIR_STATUS_BADGE[detailRepair.status] || 'badge-neutral'}>
                  {detailRepair.status}
                </Badge>
              </div>

              <div className="card-body">

                {/* Status track */}
                <div className={s.statusTrack}>
                  {STATUS_FLOW.map((st, i) => {
                    const order       = ['Pending', 'In Progress', 'Repaired', 'Completed']
                    const currentIdx  = order.indexOf(detailRepair.status)
                    const stepIdx     = order.indexOf(st)
                    const isNA        = detailRepair.status === 'Not Repairable'
                    const done        = !isNA && currentIdx > stepIdx
                    const current     = !isNA && currentIdx === stepIdx
                    return (
                      <div key={st} className={s.trackStep}>
                        <div className={`${s.trackDot}
                          ${isNA      ? s.trackDotNA      :
                            done      ? s.trackDotDone    :
                            current   ? s.trackDotCurrent :
                                        s.trackDotPending}`}
                        />
                        <span className={`${s.trackLabel} ${current && !isNA ? s.trackLabelActive : ''}`}>
                          {st}
                        </span>
                        {i < STATUS_FLOW.length - 1 && (
                          <div className={`${s.trackLine} ${done && !isNA ? s.trackLineDone : ''}`} />
                        )}
                      </div>
                    )
                  })}
                  {detailRepair.status === 'Not Repairable' && (
                    <div className={s.trackStep}>
                      <div className={s.trackDotNA} />
                      <span className={s.trackLabel} style={{ color: 'var(--danger)' }}>Not Repairable</span>
                    </div>
                  )}
                </div>

                <div className="form-divider" />

                {/* Problem */}
                <div className={s.detailSection}>
                  <div className={s.detailLabel}>Problem</div>
                  <div className={s.detailValue}>{detailRepair.problem}</div>
                </div>

                {/* Equipment info */}
                {detailEquip && (
                  <div className={s.detailSection}>
                    <div className={s.detailLabel}>Equipment</div>
                    <div className={s.equipRow}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{detailEquip.name}</span>
                      <Badge className={CONDITION_BADGE[detailEquip.condition] || 'badge-neutral'}>
                        {detailEquip.condition}
                      </Badge>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {detailEquip.category} · {detailEquip.available}/{detailEquip.total} available
                      </span>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className={s.detailSection}>
                  <div className={s.detailLabel}>Timeline</div>
                  <div className={s.timeline}>
                    <div className={s.timelineRow}>
                      <Clock size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <div>
                        <div className={s.timelineTitle}>Logged</div>
                        <div className={s.timelineVal}>{fmtDateTime(detailRepair.loggedDate)}</div>
                      </div>
                    </div>
                    {detailRepair.resolvedDate && (
                      <div className={s.timelineRow}>
                        <CheckCircle size={12} style={{ color: 'var(--ok)', flexShrink: 0 }} />
                        <div>
                          <div className={s.timelineTitle}>Resolved</div>
                          <div className={s.timelineVal}>{fmtDateTime(detailRepair.resolvedDate)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline notes editor */}
                <div className={s.detailSection}>
                  <div className={s.detailLabel}>Notes</div>
                  <InlineNotes
                    key={detailRepair.id}
                    initial={detailRepair.notes || ''}
                    onSave={(notes) => {
                      updateRepair(detailRepair.id, { notes })
                      showToast('ok', 'Notes saved', detailRepair.equipmentName)
                    }}
                  />
                </div>

              </div>

              {/* Action buttons */}
              {(STATUS_ACTIONS[detailRepair.status] || []).length > 0 && (
                <div className="card-foot" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {(STATUS_ACTIONS[detailRepair.status] || []).map(action => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.next}
                        className={`btn ${action.cls}`}
                        onClick={() => handleAction(detailRepair, action.next)}
                      >
                        <Icon size={14} /> {action.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }
      </div>

      {/* ── Log Repair Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Repair Ticket"
        subtitle="Record a new equipment repair"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>
              <Wrench size={14} /> Log Repair
            </button>
          </>
        }
      >
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Equipment <span className="required">*</span></label>
          <select
            className="form-select"
            value={form.equipmentId}
            onChange={e => setF('equipmentId', e.target.value)}
          >
            <option value="">Select equipment...</option>
            {equipCats.map(cat => (
              <optgroup key={cat} label={cat}>
                {repairableEquip
                  .filter(e => e.category === cat)
                  .map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.available} available)
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {errors.equipmentId && (
            <span style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.equipmentId}</span>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Problem Description <span className="required">*</span></label>
          <textarea
            className="form-textarea"
            placeholder="Be specific — e.g. Right velcro strap torn, padding exposed on left side"
            value={form.problem}
            onChange={e => setF('problem', e.target.value)}
            rows={3}
          />
          {errors.problem && (
            <span style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.problem}</span>
          )}
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select
              className="form-select"
              value={form.status}
              onChange={e => setF('status', e.target.value)}
            >
              <option value="Pending">Pending — awaiting assessment</option>
              <option value="In Progress">In Progress — being fixed now</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input
              className="form-input"
              placeholder="e.g. Sent to supplier, ETA 3 days"
              value={form.notes}
              onChange={e => setF('notes', e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Inline notes editor sub-component ──────────────────────
function InlineNotes({ initial, onSave }) {
  const [val,   setVal]   = useState(initial)
  const [dirty, setDirty] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <textarea
        className="form-textarea"
        placeholder="Add notes about repair progress, supplier info, parts needed..."
        value={val}
        rows={3}
        style={{ fontSize: 12 }}
        onChange={e => { setVal(e.target.value); setDirty(e.target.value !== initial) }}
      />
      {dirty && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setVal(initial); setDirty(false) }}
          >
            Discard
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { onSave(val); setDirty(false) }}
          >
            Save Notes
          </button>
        </div>
      )}
    </div>
  )
}
