import { useState, useEffect, useRef } from 'react'
import {
  Search, UserPlus, CheckCircle, Clock, User,
  Phone, Shield, Users, ChevronRight, AlertTriangle
} from 'lucide-react'
import { Modal }      from '../ui/Modal.jsx'
import { Badge }      from '../ui/Badge.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { useData }    from '../../context/DataContext.jsx'
import { useApp }     from '../../context/AppContext.jsx'
import {
  todayISO, nowISO, addDaysISO,
  fmt, fmtShort, fmtDateTime,
  daysUntil, dueBadgeProps,
} from '../../utils/date.js'
import s from './Checkout.module.css'

const EMPTY_FORM = {
  equipmentId:    '',
  qty:            '1',
  borrowerSearch: '',
  borrowerId:     '',
  borrowerName:   '',
  idNumber:       '',
  phone:          '',
  emergency:      '',
  role:           'Player',
  team:           '',
  coach:          '',
  issuedDate:     todayISO(),
  issuedTime:     new Date().toTimeString().slice(0, 5),   // HH:MM for input[type=time]
  dueDate:        addDaysISO(7),
  notes:          '',
}

const EMPTY_NEW_BORROWER = {
  name: '', idNumber: '', phone: '', emergency: '',
  role: 'Player', team: '', notes: '',
}

export function Checkout({ onNavigate, onRegisterCta }) {
  const { equipment, borrowers, checkouts, issueEquipment, addBorrower } = useData()
  const { showToast } = useApp()

  const [form,        setForm]       = useState(EMPTY_FORM)
  const [errors,      setErrors]     = useState({})
  const [suggestions, setSuggestions] = useState([])
  const [showSug,     setShowSug]    = useState(false)
  const [newBModal,   setNewBModal]  = useState(false)
  const [newBForm,    setNewBForm]   = useState(EMPTY_NEW_BORROWER)
  const searchRef = useRef()

  const activeCheckouts    = checkouts.filter(c => c.status === 'Active' || c.status === 'Partial')
  const availableEquipment = equipment.filter(e => e.available > 0 && e.status !== 'Under Repair' && e.status !== 'Lost')
  const selectedEq         = equipment.find(e => e.id === Number(form.equipmentId))

  useEffect(() => { onRegisterCta?.(() => searchRef.current?.focus()) }, [onRegisterCta])

  // ── Borrower search ───────────────────────────────────────
  const handleBorrowerSearch = (val) => {
    setF('borrowerSearch', val)
    clearBorrowerFields()
    if (val.length < 2) { setSuggestions([]); setShowSug(false); return }
    const q = val.toLowerCase()
    const hits = borrowers.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.idNumber.toLowerCase().includes(q) ||
      b.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    ).slice(0, 6)
    setSuggestions(hits)
    setShowSug(true)
  }

  const selectBorrower = (b) => {
    setForm(p => ({
      ...p,
      borrowerSearch: b.name,
      borrowerId:     b.id,
      borrowerName:   b.name,
      idNumber:       b.idNumber,
      phone:          b.phone,
      emergency:      b.emergency || '',
      role:           b.role,
      team:           b.team || '',
    }))
    setShowSug(false)
    setErrors(p => ({ ...p, borrowerName: '', idNumber: '', phone: '' }))
  }

  const clearBorrowerFields = () => {
    setForm(p => ({ ...p, borrowerId: '', borrowerName: '', idNumber: '', phone: '', emergency: '' }))
  }

  // ── Field helpers ─────────────────────────────────────────
  const setF = (field, val) => {
    setForm(p => ({ ...p, [field]: val }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  // ── Validation ────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.equipmentId)                                         e.equipmentId  = 'Select equipment'
    if (!form.qty || isNaN(Number(form.qty)) || Number(form.qty) < 1) e.qty      = 'Enter a valid quantity'
    if (selectedEq && Number(form.qty) > selectedEq.available)    e.qty          = `Only ${selectedEq.available} available`
    if (!form.borrowerName.trim())                                 e.borrowerName = 'Required'
    if (!form.idNumber.trim())                                     e.idNumber     = 'Required'
    if (!form.phone.trim())                                        e.phone        = 'Required'
    if (!form.dueDate)                                             e.dueDate      = 'Set a return date'
    return e
  }

  // ── Submit ────────────────────────────────────────────────
  const submit = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    // Auto-create borrower profile if they aren't already in the system
    let bId = form.borrowerId
    if (!bId) {
      const nb = addBorrower({
        name:      form.borrowerName.trim(),
        idNumber:  form.idNumber.trim(),
        phone:     form.phone.trim(),
        emergency: form.emergency.trim(),
        role:      form.role,
        team:      form.team.trim(),
        notes:     '',
      })
      bId = nb.id
    }

    // Build a precise ISO timestamp: combine date + time fields
    const issuedAt = new Date(`${form.issuedDate}T${form.issuedTime}:00`).toISOString()

    issueEquipment({
      equipmentId:   Number(form.equipmentId),
      equipmentName: selectedEq.name,
      borrowerId:    bId,
      borrowerName:  form.borrowerName.trim(),
      idNumber:      form.idNumber.trim(),
      phone:         form.phone.trim(),
      qty:           Number(form.qty),
      issuedAt,                          // full timestamp
      issuedDate:    form.issuedDate,    // date portion kept for display
      dueDate:       form.dueDate,
      coach:         form.coach.trim(),
      team:          form.team.trim(),
      notes:         form.notes.trim(),
    })

    showToast('ok', 'Equipment issued', `${selectedEq.name} ×${form.qty} → ${form.borrowerName.trim()}`)
    setForm({ ...EMPTY_FORM, issuedDate: todayISO(), issuedTime: new Date().toTimeString().slice(0, 5), dueDate: addDaysISO(7) })
    setErrors({})
  }

  // ── New-borrower modal helpers ────────────────────────────
  const saveNewBorrower = () => {
    if (!newBForm.name.trim() || !newBForm.idNumber.trim() || !newBForm.phone.trim()) {
      showToast('warn', 'Missing fields', 'Name, ID Number and Phone are required')
      return
    }
    const nb = addBorrower({ ...newBForm, name: newBForm.name.trim() })
    selectBorrower(nb)
    setNewBModal(false)
    setNewBForm(EMPTY_NEW_BORROWER)
    showToast('ok', 'Profile created', nb.name)
  }
  const NF = (field) => ({
    value: newBForm[field],
    onChange: (e) => setNewBForm(p => ({ ...p, [field]: e.target.value })),
  })

  return (
    <div className={s.layout}>

      {/* ══════════════════════════════════════
          LEFT — Issue form
      ══════════════════════════════════════ */}
      <div className={s.formCol}>

        {/* Equipment */}
        <div className="card mb-3">
          <div className="card-head"><div className="card-title">Equipment Selection</div></div>
          <div className="card-body">

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Equipment <span className="required">*</span></label>
              <select
                className="form-select"
                value={form.equipmentId}
                onChange={e => setF('equipmentId', e.target.value)}
              >
                <option value="">Choose equipment...</option>
                {(() => {
                  const cats = [...new Set(availableEquipment.map(e => e.category))].sort()
                  return cats.map(cat => (
                    <optgroup key={cat} label={cat}>
                      {availableEquipment.filter(e => e.category === cat).map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name} — {e.available} in stock
                        </option>
                      ))}
                    </optgroup>
                  ))
                })()}
              </select>
              {errors.equipmentId && <span className={s.err}>{errors.equipmentId}</span>}
            </div>

            {/* Stock info strip */}
            {selectedEq && (
              <div className={s.stockStrip}>
                <div className={s.stockStripRow}>
                  <span className={s.stockName}>{selectedEq.name}</span>
                  <Badge className={selectedEq.available <= selectedEq.minStock ? 'badge-warn' : 'badge-ok'}>
                    {selectedEq.available} / {selectedEq.total} available
                  </Badge>
                </div>
                <div className={s.stockMeta}>{selectedEq.category} · {selectedEq.location}</div>
                <div className="prog-wrap" style={{ marginTop: 8 }}>
                  <div className="prog-fill" style={{
                    width: `${Math.round(selectedEq.available / selectedEq.total * 100)}%`,
                    background: selectedEq.available <= selectedEq.minStock ? 'var(--warn)' : 'var(--ok)',
                  }} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Quantity <span className="required">*</span></label>
              <input
                className="form-input"
                type="number" min="1"
                max={selectedEq?.available}
                placeholder="1"
                value={form.qty}
                onChange={e => setF('qty', e.target.value)}
                style={{ maxWidth: 120 }}
              />
              {errors.qty && <span className={s.err}>{errors.qty}</span>}
            </div>
          </div>
        </div>

        {/* Borrower */}
        <div className="card mb-3">
          <div className="card-head">
            <div className="card-title">Borrower Details</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setNewBModal(true)}>
              <UserPlus size={13} /> New Profile
            </button>
          </div>
          <div className="card-body">

            {/* Search existing profiles */}
            <div className="form-group" style={{ marginBottom: 10, position: 'relative' }}>
              <label className="form-label">Search Existing Profile</label>
              <div className={s.searchBox}>
                <Search size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  className={s.searchInput}
                  placeholder="Name, ID number or phone..."
                  value={form.borrowerSearch}
                  onChange={e => handleBorrowerSearch(e.target.value)}
                  onFocus={() => suggestions.length && setShowSug(true)}
                  onBlur={() => setTimeout(() => setShowSug(false), 160)}
                  autoComplete="off"
                />
              </div>
              {showSug && suggestions.length > 0 && (
                <div className={s.dropdown}>
                  {suggestions.map(b => (
                    <div key={b.id} className={s.dropdownItem} onMouseDown={() => selectBorrower(b)}>
                      <div className={s.dropdownName}>{b.name}</div>
                      <div className={s.dropdownMeta}>{b.idNumber} · {b.phone} · {b.team}</div>
                    </div>
                  ))}
                </div>
              )}
              {form.borrowerId && (
                <div className={s.profileLoaded}>
                  <CheckCircle size={12} style={{ color: 'var(--ok)' }} />
                  Profile loaded from records
                </div>
              )}
            </div>

            <div className={s.orRow}><span>or enter manually</span></div>

            <div className="form-grid-2" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input className="form-input" placeholder="e.g. James Omondi"
                  value={form.borrowerName} onChange={e => setF('borrowerName', e.target.value)} />
                {errors.borrowerName && <span className={s.err}>{errors.borrowerName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">ID Number <span className="required">*</span></label>
                <input className="form-input" placeholder="e.g. KE-34521890"
                  value={form.idNumber} onChange={e => setF('idNumber', e.target.value)} />
                {errors.idNumber && <span className={s.err}>{errors.idNumber}</span>}
              </div>
            </div>
            <div className="form-grid-2" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label className="form-label">Phone <span className="required">*</span></label>
                <input className="form-input" placeholder="+254 7XX XXX XXX"
                  value={form.phone} onChange={e => setF('phone', e.target.value)} />
                {errors.phone && <span className={s.err}>{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact</label>
                <input className="form-input" placeholder="+254 7XX XXX XXX"
                  value={form.emergency} onChange={e => setF('emergency', e.target.value)} />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e => setF('role', e.target.value)}>
                  <option>Player</option>
                  <option>Staff</option>
                  <option>Coach</option>
                  <option>Volunteer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Team / Group</label>
                <input className="form-input" placeholder="e.g. U18 A"
                  value={form.team} onChange={e => setF('team', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Issue details */}
        <div className="card mb-3">
          <div className="card-head"><div className="card-title">Issue Details</div></div>
          <div className="card-body">

            {/* Date + time stamp row */}
            <div className="form-grid-2" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label className="form-label">
                  <Clock size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Issue Date <span className="required">*</span>
                </label>
                <input className="form-input" type="date"
                  value={form.issuedDate} onChange={e => setF('issuedDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Issue Time <span className="required">*</span></label>
                <input className="form-input" type="time"
                  value={form.issuedTime} onChange={e => setF('issuedTime', e.target.value)} />
              </div>
            </div>

            <div className="form-grid-2" style={{ marginBottom: 10 }}>
              <div className="form-group">
                <label className="form-label">Expected Return Date <span className="required">*</span></label>
                <input className="form-input" type="date"
                  value={form.dueDate} min={form.issuedDate}
                  onChange={e => setF('dueDate', e.target.value)} />
                {errors.dueDate && <span className={s.err}>{errors.dueDate}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Supervising Coach</label>
                <input className="form-input" placeholder="e.g. Peter Kamau"
                  value={form.coach} onChange={e => setF('coach', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" placeholder="e.g. For Saturday league match, return by Monday 08:00"
                value={form.notes} onChange={e => setF('notes', e.target.value)} />
            </div>
          </div>
          <div className="card-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => { setForm({ ...EMPTY_FORM, issuedDate: todayISO(), issuedTime: new Date().toTimeString().slice(0,5), dueDate: addDaysISO(7) }); setErrors({}) }}>
              Clear
            </button>
            <button className="btn btn-primary btn-lg" onClick={submit}>
              <ChevronRight size={16} />
              Issue Equipment
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT — Active checkouts
      ══════════════════════════════════════ */}
      <div className={s.listCol}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Active Checkouts</div>
              <div className="card-sub">{activeCheckouts.length} currently out</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('checkin')}>
              Process Returns
            </button>
          </div>

          {activeCheckouts.length === 0
            ? <EmptyState
                icon={<CheckCircle size={28} />}
                title="All equipment accounted for"
                subtitle="No active checkouts right now."
              />
            : activeCheckouts.map(co => {
              const { label, cls } = dueBadgeProps(co.dueDate, false)
              const du = daysUntil(co.dueDate)
              return (
                <div key={co.id} className={s.coCard}>
                  <div className={s.coHeader}>
                    <div className={s.coEquipName}>{co.equipmentName}</div>
                    <Badge className={cls}>{label}</Badge>
                  </div>

                  <div className={s.coMeta}>
                    <span className={s.coMetaItem}><User size={11} />{co.borrowerName}</span>
                    <span className={s.coMetaItem}><Shield size={11} />{co.idNumber}</span>
                    <span className={s.coMetaItem}><Phone size={11} />{co.phone}</span>
                  </div>
                  <div className={s.coMeta} style={{ marginTop: 4 }}>
                    {co.team && <span className={s.coMetaItem}><Users size={11} />{co.team}</span>}
                    {co.coach && <span className={s.coMetaItem}>{co.coach}</span>}
                  </div>

                  <div className={s.coTimestamps}>
                    <div className={s.tsBlock}>
                      <span className={s.tsLabel}>Issued</span>
                      <span className={s.tsValue}>{fmtDateTime(co.issuedAt)}</span>
                    </div>
                    <div className={s.tsDivider} />
                    <div className={s.tsBlock}>
                      <span className={s.tsLabel}>Due back</span>
                      <span className={s.tsValue} style={{
                        color: du < 0 ? 'var(--danger)' : du === 0 ? 'var(--warn)' : 'var(--text-2)',
                        fontWeight: du <= 0 ? 700 : 600,
                      }}>
                        {fmtShort(co.dueDate)}
                        {du < 0 && <AlertTriangle size={11} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                      </span>
                    </div>
                    <div className={s.tsDivider} />
                    <div className={s.tsBlock}>
                      <span className={s.tsLabel}>Qty</span>
                      <span className={s.tsValue} style={{ fontWeight: 700 }}>{co.qty}</span>
                    </div>
                  </div>

                  {co.notes && <div className={s.coNotes}>{co.notes}</div>}
                </div>
              )
            })
          }
        </div>
      </div>

      {/* ── New Borrower Modal ── */}
      <Modal
        open={newBModal}
        onClose={() => setNewBModal(false)}
        title="Create Borrower Profile"
        subtitle="Add a new player or staff member to the system"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setNewBModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveNewBorrower}>
              <UserPlus size={14} /> Save Profile
            </button>
          </>
        }
      >
        <div className="form-section-label">Personal Info</div>
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="form-label">Full Name <span className="required">*</span></label>
          <input className="form-input" placeholder="e.g. James Omondi" {...NF('name')} />
        </div>
        <div className="form-grid-2" style={{ marginBottom: 10 }}>
          <div className="form-group">
            <label className="form-label">ID Number <span className="required">*</span></label>
            <input className="form-input" placeholder="e.g. KE-34521890" {...NF('idNumber')} />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" {...NF('role')}>
              <option>Player</option><option>Staff</option><option>Coach</option><option>Volunteer</option>
            </select>
          </div>
        </div>
        <div className="form-divider" />
        <div className="form-section-label">Contact Details</div>
        <div className="form-grid-2" style={{ marginBottom: 10 }}>
          <div className="form-group">
            <label className="form-label">Phone <span className="required">*</span></label>
            <input className="form-input" placeholder="+254 7XX XXX XXX" {...NF('phone')} />
          </div>
          <div className="form-group">
            <label className="form-label">Emergency Contact</label>
            <input className="form-input" placeholder="+254 7XX XXX XXX" {...NF('emergency')} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="form-label">Team / Group</label>
          <input className="form-input" placeholder="e.g. U18 A, Coaching Staff" {...NF('team')} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="Optional notes" {...NF('notes')} />
        </div>
      </Modal>
    </div>
  )
}
