import { useState, useEffect } from 'react'
import { UserPlus, User, Phone, Shield, Users, Edit2, Clock, Package, Trash2 } from 'lucide-react'
import { Modal }      from '../ui/Modal.jsx'
import { Badge }      from '../ui/Badge.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { useData }    from '../../context/DataContext.jsx'
import { useApp }     from '../../context/AppContext.jsx'
import { fmt, fmtDateTime, dueBadgeProps } from '../../utils/date.js'
import s from './Borrowers.module.css'

const EMPTY_FORM = {
  name: '', idNumber: '', phone: '', emergency: '',
  role: 'Player', team: '', notes: '',
}

const ROLE_BADGE = {
  Player:    'badge-brand',
  Staff:     'badge-info',
  Coach:     'badge-purple',
  Volunteer: 'badge-neutral',
}

export function Borrowers({ searchValue, onRegisterCta }) {
  const { borrowers, checkouts, addBorrower, updateBorrower, deleteBorrower } = useData()
  const { showToast } = useApp()

  const [modalOpen,   setModalOpen]  = useState(false)
  const [editing,     setEditing]    = useState(null)
  const [form,        setForm]       = useState(EMPTY_FORM)
  const [errors,      setErrors]     = useState({})
  const [detailId,    setDetailId]   = useState(null)  // expanded profile

  useEffect(() => { onRegisterCta?.(() => openAdd()) }, [onRegisterCta])

  const filtered = borrowers.filter(b => {
    const q = searchValue?.toLowerCase() || ''
    return !q ||
      b.name.toLowerCase().includes(q) ||
      b.idNumber.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.team?.toLowerCase().includes(q)
  })

  const detailBorrower = borrowers.find(b => b.id === detailId)
  const borrowerHistory = detailId
    ? checkouts.filter(c => c.borrowerId === detailId)
        .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
    : []

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true)
  }
  const openEdit = (b) => {
    setEditing(b)
    setForm({ name: b.name, idNumber: b.idNumber, phone: b.phone,
              emergency: b.emergency || '', role: b.role, team: b.team || '', notes: b.notes || '' })
    setErrors({}); setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())     e.name     = 'Required'
    if (!form.idNumber.trim()) e.idNumber = 'Required'
    if (!form.phone.trim())    e.phone    = 'Required'
    return e
  }

  const save = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const data = {
      name: form.name.trim(), idNumber: form.idNumber.trim(),
      phone: form.phone.trim(), emergency: form.emergency.trim(),
      role: form.role, team: form.team.trim(), notes: form.notes.trim(),
    }
    if (editing) {
      updateBorrower(editing.id, data)
      showToast('ok', 'Profile updated', data.name)
    } else {
      addBorrower(data)
      showToast('ok', 'Profile created', data.name)
    }
    setModalOpen(false)
  }

  const F = (field) => ({
    value: form[field],
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })) },
  })

  // Active borrow count per borrower
  const activeBorrows = (bid) => checkouts.filter(c => c.borrowerId === bid && (c.status === 'Active' || c.status === 'Partial')).length

  return (
    <div className={s.layout}>

      {/* ══════════════════════════════════════
          LEFT — Borrowers list
      ══════════════════════════════════════ */}
      <div className={s.listCol}>
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {filtered.length} profile{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0
          ? <div className="card">
              <EmptyState
                icon={<User size={28} />}
                title="No profiles found"
                subtitle="Add a player or staff member to get started."
                action={<button className="btn btn-primary btn-sm" onClick={openAdd}><UserPlus size={13} /> Add Profile</button>}
              />
            </div>
          : (
            <div className="card">
              {filtered.map(b => {
                const active = activeBorrows(b.id)
                const total  = checkouts.filter(c => c.borrowerId === b.id).length
                const isSelected = detailId === b.id
                return (
                  <div
                    key={b.id}
                    className={`${s.borrowerRow} ${isSelected ? s.selected : ''}`}
                    onClick={() => setDetailId(isSelected ? null : b.id)}
                  >
                    {/* Avatar */}
                    <div className={s.avatar}>
                      {b.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className={s.borrowerInfo}>
                      <div className={s.borrowerName}>{b.name}</div>
                      <div className={s.borrowerMeta}>
                        <span className={s.metaItem}><Shield size={10} />{b.idNumber}</span>
                        <span className={s.metaItem}><Phone size={10} />{b.phone}</span>
                        {b.team && <span className={s.metaItem}><Users size={10} />{b.team}</span>}
                      </div>
                    </div>

                    <div className={s.borrowerRight}>
                      <Badge className={ROLE_BADGE[b.role] || 'badge-neutral'}>{b.role}</Badge>
                      {active > 0 && (
                        <Badge className="badge-warn" style={{ marginTop: 4 }}>{active} out</Badge>
                      )}
                      <div className={s.borrowerTotal}>{total} borrow{total !== 1 ? 's' : ''}</div>
                    </div>

                    <button
                      className={s.editBtn}
                      onClick={e => { e.stopPropagation(); openEdit(b) }}
                      title="Edit profile"
                    >
                      <Edit2 size={12} />
                    </button>
                    {activeBorrows(b.id) === 0 && (
                      <button
                        className={s.deleteBtn}
                        onClick={e => {
                          e.stopPropagation()
                          if (window.confirm(`Delete profile for ${b.name}?`)) {
                            deleteBorrower(b.id)
                            if (detailId === b.id) setDetailId(null)
                          }
                        }}
                        title="Delete profile"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {/* ══════════════════════════════════════
          RIGHT — Profile detail + history
      ══════════════════════════════════════ */}
      <div className={s.detailCol}>
        {!detailBorrower
          ? (
            <div className="card">
              <EmptyState
                icon={<User size={28} />}
                title="Select a profile"
                subtitle="Click any borrower on the left to view their full details and borrow history."
              />
            </div>
          )
          : (
            <>
              {/* Profile card */}
              <div className="card mb-3">
                <div className="card-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={s.avatarLg}>
                      {detailBorrower.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className={s.detailName}>{detailBorrower.name}</div>
                      <Badge className={ROLE_BADGE[detailBorrower.role] || 'badge-neutral'}>
                        {detailBorrower.role}
                      </Badge>
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(detailBorrower)}>
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
                <div className="card-body">
                  <div className={s.detailGrid}>
                    <div className={s.detailField}>
                      <div className={s.detailLabel}>ID Number</div>
                      <div className={s.detailValue}>{detailBorrower.idNumber}</div>
                    </div>
                    <div className={s.detailField}>
                      <div className={s.detailLabel}>Team / Group</div>
                      <div className={s.detailValue}>{detailBorrower.team || '—'}</div>
                    </div>
                    <div className={s.detailField}>
                      <div className={s.detailLabel}>Phone</div>
                      <div className={s.detailValue}>{detailBorrower.phone}</div>
                    </div>
                    <div className={s.detailField}>
                      <div className={s.detailLabel}>Emergency Contact</div>
                      <div className={s.detailValue}>{detailBorrower.emergency || '—'}</div>
                    </div>
                    <div className={s.detailField}>
                      <div className={s.detailLabel}>Member Since</div>
                      <div className={s.detailValue}>{fmt(detailBorrower.joinDate)}</div>
                    </div>
                    <div className={s.detailField}>
                      <div className={s.detailLabel}>Total Borrows</div>
                      <div className={s.detailValue} style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 16 }}>
                        {borrowerHistory.length}
                      </div>
                    </div>
                  </div>
                  {detailBorrower.notes && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      {detailBorrower.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Borrow history */}
              <div className="card">
                <div className="card-head">
                  <div className="card-title">Borrow History</div>
                  <div className="card-sub" style={{ marginTop: 0, fontSize: 11, color: 'var(--text-3)' }}>
                    {borrowerHistory.length} record{borrowerHistory.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {borrowerHistory.length === 0
                  ? <EmptyState
                      icon={<Package size={24} />}
                      title="No borrows yet"
                      subtitle="This profile has no checkout history."
                    />
                  : borrowerHistory.map(co => {
                    const { label, cls } = dueBadgeProps(co.dueDate, co.status === 'Returned')
                    return (
                      <div key={co.id} className={s.histRow}>
                        <div className={s.histMain}>
                          <div className={s.histEquip}>{co.equipmentName}</div>
                          <Badge className={cls}>{label}</Badge>
                        </div>
                        <div className={s.histMeta}>
                          <span className={s.metaItem}><Package size={10} />×{co.qty}</span>
                          {co.team && <span className={s.metaItem}><Users size={10} />{co.team}</span>}
                        </div>
                        <div className={s.histTimestamps}>
                          <span>
                            <span className={s.tsLabel}>Issued </span>
                            <span className={s.tsVal}>{fmtDateTime(co.issuedAt)}</span>
                          </span>
                          {co.returnLines?.length > 0 && co.returnLines[0]?.returnedAt && (
                            <>
                              <span className={s.tsDot} />
                              <span>
                                <span className={s.tsLabel}>Returned </span>
                                <span className={s.tsVal}>{fmtDateTime(co.returnLines[0].returnedAt)}</span>
                              </span>
                            </>
                          )}
                        </div>
                        {co.returnLines?.length > 0 && (
                          <div className={s.returnSummary}>
                            {co.returnLines.map((l, i) => (
                              <span key={i} className={`badge ${l.condition === 'Good' ? 'badge-ok' : l.condition === 'Damaged' ? 'badge-warn' : 'badge-danger'}`}>
                                {l.qty} × {l.condition}
                              </span>
                            ))}
                          </div>
                        )}
                        {co.notes && <div className={s.histNote}>{co.notes}</div>}
                      </div>
                    )
                  })
                }
              </div>
            </>
          )
        }
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Profile' : 'Add Borrower Profile'}
        subtitle={editing ? editing.name : 'New player or staff member'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Save Changes' : <><UserPlus size={14} /> Create Profile</>}
            </button>
          </>
        }
      >
        <div className="form-section-label">Personal Info</div>
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="form-label">Full Name <span className="required">*</span></label>
          <input className="form-input" placeholder="e.g. James Omondi" {...F('name')} />
          {errors.name && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.name}</span>}
        </div>
        <div className="form-grid-2" style={{ marginBottom: 10 }}>
          <div className="form-group">
            <label className="form-label">ID Number <span className="required">*</span></label>
            <input className="form-input" placeholder="e.g. KE-34521890" {...F('idNumber')} />
            {errors.idNumber && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.idNumber}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" {...F('role')}>
              <option>Player</option><option>Staff</option><option>Coach</option><option>Volunteer</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 10 }}>
          <label className="form-label">Team / Group</label>
          <input className="form-input" placeholder="e.g. U18 A, Coaching Staff" {...F('team')} />
        </div>

        <div className="form-divider" />
        <div className="form-section-label">Contact Details</div>
        <div className="form-grid-2" style={{ marginBottom: 10 }}>
          <div className="form-group">
            <label className="form-label">Phone <span className="required">*</span></label>
            <input className="form-input" placeholder="+254 7XX XXX XXX" {...F('phone')} />
            {errors.phone && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.phone}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Emergency Contact</label>
            <input className="form-input" placeholder="+254 7XX XXX XXX" {...F('emergency')} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="Optional notes" {...F('notes')} />
        </div>
      </Modal>
    </div>
  )
}
