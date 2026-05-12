import { useState } from 'react'
import { Plus, Trash2, CheckCircle, Clock, AlertTriangle, Package, XCircle } from 'lucide-react'
import { Badge }      from '../ui/Badge.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { useData }    from '../../context/DataContext.jsx'
import { useApp }     from '../../context/AppContext.jsx'
import {
  todayISO, fmtDateTime, fmtShort, daysUntil, dueBadgeProps,
} from '../../utils/date.js'
import s from './Checkin.module.css'

// ── A single return line: qty + condition + notes ─────────────
function ReturnLine({ line, index, onChange, onRemove, maxQty }) {
  return (
    <div className={s.returnLine}>
      <div className={s.lineNum}>{index + 1}</div>

      <div className={s.lineFields}>
        <div className={s.lineField}>
          <label className={s.lineLabel}>Quantity</label>
          <input
            className="form-input"
            type="number" min="1" max={maxQty}
            value={line.qty}
            onChange={e => onChange(index, 'qty', e.target.value)}
            style={{ width: 80 }}
          />
        </div>

        <div className={s.lineField} style={{ flex: 1 }}>
          <label className={s.lineLabel}>Condition</label>
          <select
            className="form-select"
            value={line.condition}
            onChange={e => onChange(index, 'condition', e.target.value)}
          >
            <option value="Good">Good — return to store</option>
            <option value="Damaged">Damaged — log for repair</option>
            <option value="Lost">Lost — reduce stock</option>
          </select>
        </div>

        <div className={s.lineField} style={{ flex: 2 }}>
          <label className={s.lineLabel}>
            {line.condition === 'Damaged' ? 'Damage Description' : 'Notes'}
          </label>
          <input
            className="form-input"
            placeholder={
              line.condition === 'Damaged' ? 'e.g. Right strap torn, sole detaching...' :
              line.condition === 'Lost'    ? 'e.g. Left on away ground, unretrievable' :
              'Optional notes'
            }
            value={line.notes}
            onChange={e => onChange(index, 'notes', e.target.value)}
          />
        </div>

        <div className={s.conditionIndicator}>
          <div className={`${s.condDot} ${s['cond_' + line.condition]}`} />
        </div>
      </div>

      {index > 0 && (
        <button className={s.removeLine} onClick={() => onRemove(index)} title="Remove line">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

export function Checkin({ onNavigate }) {
  const { checkouts, returnEquipment, deleteReturnRecord } = useData()
  const { showToast } = useApp()

  const [selectedId,   setSelectedId]   = useState('')
  const [returnLines,  setReturnLines]  = useState([{ qty: '', condition: 'Good', notes: '' }])
  const [returnDate,   setReturnDate]   = useState(todayISO())
  const [returnTime,   setReturnTime]   = useState(new Date().toTimeString().slice(0, 5))
  const [errors,       setErrors]       = useState({})

  const activeCheckouts = checkouts.filter(c => c.status === 'Active' || c.status === 'Partial')
  const returnHistory   = checkouts.filter(c => c.status === 'Returned' || c.status === 'Partial').slice(0, 15)
  const selectedCo      = checkouts.find(c => c.id === selectedId)

  // How many have already been returned in previous transactions
  const alreadyReturned = selectedCo
    ? (selectedCo.returnLines || []).reduce((s, l) => s + l.qty, 0)
    : 0
  // How many are still outstanding before THIS form submission
  const outstandingQty  = selectedCo ? selectedCo.qty - alreadyReturned : 0
  // Running total of what the user is entering right now
  const totalReturnQty  = returnLines.reduce((s, l) => s + (Number(l.qty) || 0), 0)
  // After this submission
  const remainingQty    = outstandingQty - totalReturnQty

  // ── Return lines management ───────────────────────────────
  const addLine = () => setReturnLines(p => [...p, { qty: '', condition: 'Good', notes: '' }])

  const removeLine = (i) => setReturnLines(p => p.filter((_, idx) => idx !== i))

  const updateLine = (i, field, val) => {
    setReturnLines(p => p.map((l, idx) => idx === i ? { ...l, [field]: val } : l))
    setErrors(p => ({ ...p, lines: '' }))
  }

  // Auto-fill qty when checkout is selected and only one line
  const selectCheckout = (id) => {
    setSelectedId(id)
    const co = checkouts.find(c => c.id === id)
    if (co) {
      const alreadyRet = (co.returnLines || []).reduce((s, l) => s + l.qty, 0)
      const outstanding = co.qty - alreadyRet
      setReturnLines([{ qty: String(outstanding), condition: 'Good', notes: '' }])
    }
    setErrors({})
  }

  // ── Validation ────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!selectedId) { e.checkout = 'Select a checkout record'; return e }
    if (returnLines.some(l => !l.qty || Number(l.qty) < 1))
      e.lines = 'Each line needs a quantity of at least 1'
    if (totalReturnQty > outstandingQty)
      e.lines = `Total (${totalReturnQty}) exceeds outstanding (${outstandingQty})`
    if (returnLines.filter(l => l.condition === 'Damaged').some(l => !l.notes.trim()))
      e.lines = 'Describe the damage for each damaged item'
    return e
  }

  // ── Submit ────────────────────────────────────────────────
  const submit = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const returnedAt = new Date(`${returnDate}T${returnTime}:00`).toISOString()

    const lines = returnLines.map(l => ({
      qty:       Number(l.qty),
      condition: l.condition,
      notes:     l.notes.trim(),
      returnedAt,
      returnDate,
      returnTime,
    }))

    returnEquipment(selectedId, lines)

    const summary = lines.map(l => `${l.qty} ×${l.condition}`).join(', ')
    showToast('ok', 'Return processed', `${selectedCo.equipmentName}: ${summary}`)

    // Reset
    setSelectedId('')
    setReturnLines([{ qty: '', condition: 'Good', notes: '' }])
    setReturnDate(todayISO())
    setReturnTime(new Date().toTimeString().slice(0, 5))
    setErrors({})
  }

  // ── Condition summary pill colours ───────────────────────
  const condBadgeCls = (c) =>
    c === 'Good' ? 'badge-ok' : c === 'Damaged' ? 'badge-warn' : 'badge-danger'

  return (
    <div className={s.layout}>

      {/* ══════════════════════════════════════
          LEFT — Return form
      ══════════════════════════════════════ */}
      <div className={s.formCol}>

        {/* Select checkout */}
        <div className="card mb-3">
          <div className="card-head"><div className="card-title">Select Checkout Record</div></div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Active Checkout <span className="required">*</span></label>
              <select
                className="form-select"
                value={selectedId}
                onChange={e => selectCheckout(e.target.value)}
              >
                <option value="">Choose a checkout to process...</option>
                {activeCheckouts.map(co => {
                  const du = daysUntil(co.dueDate)
                  const flag = du < 0 ? ' ⚠ OVERDUE' : du === 0 ? ' · Due today' : ''
                  return (
                    <option key={co.id} value={co.id}>
                      {co.equipmentName} — {co.borrowerName} · ×{co.qty}{flag}
                    </option>
                  )
                })}
              </select>
              {errors.checkout && <span className={s.err}>{errors.checkout}</span>}
            </div>

            {/* Selected checkout summary */}
            {selectedCo && (
              <div className={s.coSummary}>
                <div className={s.coSummaryRow}>
                  <div>
                    <div className={s.coSummaryName}>{selectedCo.equipmentName}</div>
                    <div className={s.coSummaryMeta}>
                      {selectedCo.borrowerName} · {selectedCo.idNumber} · {selectedCo.phone}
                    </div>
                  </div>
                  <Badge className={dueBadgeProps(selectedCo.dueDate, false).cls}>
                    {dueBadgeProps(selectedCo.dueDate, false).label}
                  </Badge>
                </div>
                <div className={s.coSummaryTimestamps}>
                  <span>
                    <span className={s.tsLabel}>Issued</span>
                    <span className={s.tsVal}>{fmtDateTime(selectedCo.issuedAt)}</span>
                  </span>
                  <span className={s.tsDot} />
                  <span>
                    <span className={s.tsLabel}>Due</span>
                    <span className={s.tsVal}>{fmtShort(selectedCo.dueDate)}</span>
                  </span>
                  <span className={s.tsDot} />
                  <span>
                    <span className={s.tsLabel}>Issued</span>
                    <span className={s.tsVal} style={{ fontWeight: 700 }}>{selectedCo.qty}</span>
                  </span>
                  <span className={s.tsDot} />
                  <span>
                    <span className={s.tsLabel}>Outstanding</span>
                    <span className={s.tsVal} style={{ fontWeight: 700, color: outstandingQty > 0 ? 'var(--warn)' : 'var(--ok)' }}>
                      {outstandingQty}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Return timestamp */}
        <div className="card mb-3">
          <div className="card-head">
            <div className="card-title">Return Timestamp</div>
            <div className="card-sub" style={{ marginTop: 0, fontSize: 11, color: 'var(--text-3)' }}>
              Date and time of physical return
            </div>
          </div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  <Clock size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Return Date <span className="required">*</span>
                </label>
                <input className="form-input" type="date"
                  value={returnDate} onChange={e => setReturnDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Return Time <span className="required">*</span></label>
                <input className="form-input" type="time"
                  value={returnTime} onChange={e => setReturnTime(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Split return lines */}
        <div className="card mb-3">
          <div className="card-head">
            <div>
              <div className="card-title">Return Lines</div>
              <div className="card-sub">
                Add one line per condition group — e.g. 9 Good + 1 Damaged
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={addLine}>
              <Plus size={13} /> Add Line
            </button>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>

            {returnLines.map((line, i) => (
              <ReturnLine
                key={i}
                line={line}
                index={i}
                onChange={updateLine}
                onRemove={removeLine}
                maxQty={selectedCo?.qty || 999}
              />
            ))}

            {errors.lines && (
              <div className="alert alert-warn" style={{ marginTop: 8 }}>
                <AlertTriangle size={14} />
                <div>{errors.lines}</div>
              </div>
            )}

            {/* Running total */}
            {selectedCo && (
              <div className={s.qtyTotal}>
                <div className={s.qtyRow}>
                  <span>Total returning</span>
                  <span className={s.qtyNum}
                    style={{ color: totalReturnQty > outstandingQty ? 'var(--danger)' : totalReturnQty === outstandingQty ? 'var(--ok)' : 'var(--warn)' }}>
                    {totalReturnQty} / {outstandingQty}
                  </span>
                </div>
                {remainingQty > 0 && (
                  <div className={s.qtyRow} style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    <span>{remainingQty} unit(s) still outstanding after this return</span>
                  </div>
                )}
                {/* Condition breakdown */}
                <div className={s.condBreakdown}>
                  {returnLines.map((l, i) => (
                    <span key={i} className={`badge ${condBadgeCls(l.condition)}`}>
                      {l.qty || '—'} × {l.condition}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="card-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => { setSelectedId(''); setReturnLines([{ qty: '', condition: 'Good', notes: '' }]); setErrors({}) }}>
              Clear
            </button>
            <button
              className="btn btn-primary btn-lg"
              onClick={submit}
              disabled={!selectedId}
            >
              <CheckCircle size={16} />
              Confirm Return
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT — Return history
      ══════════════════════════════════════ */}
      <div className={s.listCol}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Return History</div>
              <div className="card-sub">Recent processed returns</div>
            </div>
          </div>

          {returnHistory.length === 0
            ? <EmptyState
                icon={<Package size={28} />}
                title="No returns yet"
                subtitle="Processed returns will appear here."
              />
            : returnHistory.map(co => (
              <div key={co.id} className={s.histCard}>
                <div className={s.histHeader}>
                  <div className={s.histEquipName}>{co.equipmentName}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Badge className={co.status === 'Returned' ? 'badge-ok' : 'badge-warn'}>
                      {co.status}
                    </Badge>
                    <button
                      className="btn btn-danger btn-sm"
                      title="Delete return record"
                      onClick={() => {
                        if (window.confirm('Delete this return record? Stock will be adjusted.'))
                          deleteReturnRecord(co.id)
                      }}
                    ><XCircle size={12} /></button>
                  </div>
                </div>

                <div className={s.histMeta}>
                  {co.borrowerName} · {co.idNumber}
                </div>

                {/* Per-line breakdown */}
                {co.returnLines?.length > 0 && (
                  <div className={s.returnLinesSummary}>
                    {co.returnLines.map((l, i) => (
                      <div key={i} className={s.rlRow}>
                        <Badge className={condBadgeCls(l.condition)}>
                          {l.qty} × {l.condition}
                        </Badge>
                        {l.notes && <span className={s.rlNote}>{l.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamps */}
                <div className={s.histTimestamps}>
                  <span className={s.tsLabel}>Issued</span>
                  <span className={s.tsVal}>{fmtDateTime(co.issuedAt)}</span>
                  <span className={s.tsDot} />
                  <span className={s.tsLabel}>Returned</span>
                  <span className={s.tsVal}>
                    {co.returnLines?.[0]?.returnedAt
                      ? fmtDateTime(co.returnLines[0].returnedAt)
                      : fmtShort(co.returnedDate)}
                  </span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
