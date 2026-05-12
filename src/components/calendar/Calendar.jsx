import { useState, useEffect } from 'react'
import {
  Plus, Trash2, CheckSquare, Square,
  CalendarDays, Package, User, Users,
  Phone, ChevronRight, Edit2, Shield
} from 'lucide-react'
import { Modal }          from '../ui/Modal.jsx'
import { Badge }          from '../ui/Badge.jsx'
import { EmptyState }     from '../ui/EmptyState.jsx'
import { CategorySelect } from '../ui/CategorySelect.jsx'
import { useData }        from '../../context/DataContext.jsx'
import { useApp }         from '../../context/AppContext.jsx'
import { fmt, fmtDateTime, daysUntil } from '../../utils/date.js'
import { EVENT_TYPE_BADGE, EVENT_TYPES } from '../../utils/constants.js'
import s from './Calendar.module.css'

const EMPTY_EVENT_FORM  = { name:'', date:'', type:'Match', sport:'', venue:'Home', notes:'' }
const VENUE_OPTS        = ['Home','Away','Neutral']

export function CalendarPage({ onRegisterCta }) {
  const {
    equipment, borrowers, checkouts, events,
    addEvent, updateEvent, deleteEvent,
    addPackingItem, removePackingItem, togglePackingItemPacked,
    issueEquipment, addBorrower,
  } = useData()
  const { showToast } = useApp()

  const [eventModal,   setEventModal]   = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventForm,    setEventForm]    = useState(EMPTY_EVENT_FORM)
  const [eventErrors,  setEventErrors]  = useState({})
  const [selectedId,   setSelectedId]   = useState(null)
  const [typeFilter,   setTypeFilter]   = useState('')
  const [showPast,     setShowPast]     = useState(false)

  // Packing item modal
  const [packModal,  setPackModal]  = useState(false)
  const [packForm,   setPackForm]   = useState({ equipmentId:'', qty:'1', notes:'' })
  const [packErrors, setPackErrors] = useState({})

  // Issue-to-event modal (assign person-in-charge and formally check out)
  const [issueModal,  setIssueModal]  = useState(false)
  const [issueItem,   setIssueItem]   = useState(null)  // packing item being issued
  const [issueForm,   setIssueForm]   = useState({
    borrowerSearch:'', borrowerId:'', borrowerName:'', idNumber:'',
    phone:'', emergency:'', role:'Staff', team:'', dueDate:'', notes:''
  })
  const [issueSuggestions, setIssueSuggestions] = useState([])
  const [showIssueSug,     setShowIssueSug]      = useState(false)
  const [issueErrors,      setIssueErrors]       = useState({})

  useEffect(() => { onRegisterCta?.(() => openAddEvent()) }, [onRegisterCta])

  // ── Helpers ────────────────────────────────────────────────
  const now       = new Date()
  const sorted    = [...events].sort((a,b) => new Date(a.date)-new Date(b.date))
  const upcoming  = sorted.filter(e => daysUntil(e.date) >= 0)
  const past      = sorted.filter(e => daysUntil(e.date) < 0)
  const filterEvs = list => list.filter(e => !typeFilter || e.type === typeFilter)
  const selectedEvent = events.find(e => e.id === selectedId)
  const equipCats = [...new Set(equipment.map(e => e.category))].sort()

  const countdownLabel = (date) => {
    const d = daysUntil(date)
    if (d < 0)   return { text:`${Math.abs(d)}d ago`,  cls: s.pastLabel  }
    if (d === 0) return { text:'Today',                cls: s.todayLabel }
    if (d === 1) return { text:'Tomorrow',             cls: s.soonLabel  }
    if (d <= 7)  return { text:`In ${d} days`,         cls: s.soonLabel  }
    return              { text:fmt(date,'d MMM'),      cls: s.futureLabel}
  }

  const packProgress = (ev) => {
    if (!ev.packingList?.length) return null
    const packed = ev.packingList.filter(i => i.packed).length
    return { packed, total: ev.packingList.length }
  }

  // Check if a packing item has already been formally issued
  const getIssuedCheckout = (item) =>
    checkouts.find(c => c.eventPackingId === item.id && (c.status === 'Active' || c.status === 'Partial'))

  // ── Event CRUD ─────────────────────────────────────────────
  const openAddEvent = () => {
    setEditingEvent(null); setEventForm(EMPTY_EVENT_FORM)
    setEventErrors({}); setEventModal(true)
  }
  const openEditEvent = (ev) => {
    setEditingEvent(ev)
    setEventForm({ name:ev.name, date:ev.date, type:ev.type, sport:ev.sport, venue:ev.venue, notes:ev.notes||'' })
    setEventErrors({}); setEventModal(true)
  }
  const validateEvent = () => {
    const e = {}
    if (!eventForm.name.trim()) e.name  = 'Required'
    if (!eventForm.date)        e.date  = 'Required'
    if (!eventForm.sport)       e.sport = 'Select sport'
    return e
  }
  const saveEvent = () => {
    const errs = validateEvent()
    if (Object.keys(errs).length) { setEventErrors(errs); return }
    const data = { name:eventForm.name.trim(), date:eventForm.date, type:eventForm.type, sport:eventForm.sport, venue:eventForm.venue, notes:eventForm.notes.trim() }
    if (editingEvent) { updateEvent(editingEvent.id, data); showToast('ok','Event updated', data.name) }
    else              { const ev = addEvent(data); setSelectedId(ev.id); showToast('ok','Event added', data.name) }
    setEventModal(false)
  }

  // ── Packing list ───────────────────────────────────────────
  const validatePack = () => {
    const e = {}
    if (!packForm.equipmentId) e.equipmentId = 'Select equipment'
    if (!packForm.qty || isNaN(Number(packForm.qty)) || Number(packForm.qty)<1) e.qty = 'Enter quantity'
    return e
  }
  const savePacking = () => {
    const errs = validatePack()
    if (Object.keys(errs).length) { setPackErrors(errs); return }
    const eq = equipment.find(e => String(e.id) === String(packForm.equipmentId))
    addPackingItem(selectedId, {
      equipmentId:   packForm.equipmentId,
      equipmentName: eq?.name || '',
      category:      eq?.category || '',
      qty:           Number(packForm.qty),
      notes:         packForm.notes.trim(),
    })
    showToast('ok', 'Added to packing list', eq?.name)
    setPackForm({ equipmentId:'', qty:'1', notes:'' })
    setPackErrors({})
    setPackModal(false)
  }

  // ── Issue to event (formal checkout linked to packing item) ─
  const openIssueModal = (item) => {
    setIssueItem(item)
    setIssueForm({
      borrowerSearch:'', borrowerId:'', borrowerName:'',
      idNumber:'', phone:'', emergency:'', role:'Staff',
      team: selectedEvent?.sport || '',
      dueDate: selectedEvent?.date || '',
      notes: `Issued for: ${selectedEvent?.name || 'event'}`,
    })
    setIssueErrors({})
    setIssueSuggestions([])
    setIssueModal(true)
  }

  const handleIssueSearch = (val) => {
    setIssueForm(p => ({ ...p, borrowerSearch:val, borrowerId:'', borrowerName:'', idNumber:'', phone:'' }))
    if (val.length < 2) { setIssueSuggestions([]); setShowIssueSug(false); return }
    const q = val.toLowerCase()
    const hits = borrowers.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.idNumber.toLowerCase().includes(q) ||
      b.phone.includes(q)
    ).slice(0,6)
    setIssueSuggestions(hits); setShowIssueSug(true)
  }

  const selectIssueBorrower = (b) => {
    setIssueForm(p => ({ ...p, borrowerSearch:b.name, borrowerId:b.id, borrowerName:b.name, idNumber:b.idNumber, phone:b.phone, emergency:b.emergency||'', team:b.team||p.team }))
    setShowIssueSug(false)
  }

  const validateIssue = () => {
    const e = {}
    if (!issueForm.borrowerName.trim()) e.borrowerName = 'Required'
    if (!issueForm.idNumber.trim())     e.idNumber     = 'Required'
    if (!issueForm.phone.trim())        e.phone        = 'Required'
    if (!issueForm.dueDate)             e.dueDate      = 'Required'
    return e
  }

  const confirmIssue = async () => {
    const errs = validateIssue()
    if (Object.keys(errs).length) { setIssueErrors(errs); return }
    if (!issueItem) return

    const eq = equipment.find(e => String(e.id) === String(issueItem.equipmentId))
    if (!eq) { showToast('error','Equipment not found'); return }
    if (eq.available < issueItem.qty) {
      showToast('warn','Insufficient stock', `Only ${eq.available} available, need ${issueItem.qty}`); return
    }

    // Create borrower profile if new
    let bId = issueForm.borrowerId
    if (!bId) {
      const nb = await addBorrower({
        name:issueForm.borrowerName.trim(), idNumber:issueForm.idNumber.trim(),
        phone:issueForm.phone.trim(), emergency:issueForm.emergency.trim(),
        role:issueForm.role, team:issueForm.team.trim(), notes:'',
      })
      bId = nb.id
    }

    const now2 = new Date()
    await issueEquipment({
      equipmentId:       issueItem.equipmentId,
      equipmentName:     eq.name,
      borrowerId:        bId,
      borrowerName:      issueForm.borrowerName.trim(),
      idNumber:          issueForm.idNumber.trim(),
      phone:             issueForm.phone.trim(),
      qty:               issueItem.qty,
      issuedAt:          now2.toISOString(),
      issuedDate:        now2.toISOString().split('T')[0],
      dueDate:           issueForm.dueDate,
      coach:             issueForm.borrowerName.trim(),
      team:              issueForm.team.trim(),
      notes:             issueForm.notes.trim(),
      eventId:           selectedId,
      eventPackingId:    issueItem.id,
    })

    // Mark packing item as packed
    togglePackingItemPacked(selectedId, issueItem.id)

    showToast('ok', `${eq.name} ×${issueItem.qty} issued`, `To: ${issueForm.borrowerName.trim()}`)
    setIssueModal(false)
  }

  const setEF  = (f,v) => { setEventForm(p => ({...p,[f]:v})); setEventErrors(p => ({...p,[f]:''})) }
  const setPF  = (f,v) => { setPackForm(p => ({...p,[f]:v})); setPackErrors(p => ({...p,[f]:''})) }
  const setIF  = (f,v) => { setIssueForm(p => ({...p,[f]:v})); setIssueErrors(p => ({...p,[f]:''})) }

  return (
    <div className={s.layout}>

      {/* ══ LEFT — event list ══ */}
      <div className={s.listCol}>
        <div className={s.filterBar}>
          <select className="form-select" style={{width:160}} value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className={`btn btn-ghost btn-sm ${showPast?s.pastToggleActive:''}`} onClick={() => setShowPast(p=>!p)}>
            {showPast ? 'Hide past' : 'Show past'}
          </button>
          <button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}} onClick={openAddEvent}>
            <Plus size={14}/> Add Event
          </button>
        </div>

        <div className={s.sectionLabel}>Upcoming — {filterEvs(upcoming).length} event{filterEvs(upcoming).length!==1?'s':''}</div>
        <div className="card mb-3">
          {filterEvs(upcoming).length === 0
            ? <EmptyState icon={<CalendarDays size={28}/>} title="No upcoming events" subtitle="Add a match, training or tournament." action={<button className="btn btn-primary btn-sm" onClick={openAddEvent}><Plus size={13}/> Add Event</button>}/>
            : filterEvs(upcoming).map(ev => (
              <EventRow key={ev.id} ev={ev} selected={selectedId===ev.id}
                onSelect={() => setSelectedId(id => id===ev.id?null:ev.id)}
                onEdit={() => openEditEvent(ev)}
                onDelete={() => { deleteEvent(ev.id); if(selectedId===ev.id) setSelectedId(null); showToast('ok','Event deleted') }}
                countdownLabel={countdownLabel} packProgress={packProgress}/>
            ))
          }
        </div>

        {showPast && filterEvs(past).length > 0 && (
          <>
            <div className={s.sectionLabel} style={{opacity:.6}}>Past — {filterEvs(past).length}</div>
            <div className="card" style={{opacity:.7}}>
              {filterEvs(past).map(ev => (
                <EventRow key={ev.id} ev={ev} selected={selectedId===ev.id}
                  onSelect={() => setSelectedId(id => id===ev.id?null:ev.id)}
                  onEdit={() => openEditEvent(ev)}
                  onDelete={() => { deleteEvent(ev.id); if(selectedId===ev.id) setSelectedId(null) }}
                  countdownLabel={countdownLabel} packProgress={packProgress} past/>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══ RIGHT — event detail + packing list ══ */}
      <div className={s.detailCol}>
        {!selectedEvent
          ? <div className="card"><EmptyState icon={<Package size={28}/>} title="Select an event" subtitle="Click any event to manage its equipment packing list."/></div>
          : (
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">{selectedEvent.name}</div>
                  <div className="card-sub">{fmt(selectedEvent.date)} · {selectedEvent.venue}</div>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <Badge className={EVENT_TYPE_BADGE[selectedEvent.type]||'badge-neutral'}>{selectedEvent.type}</Badge>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditEvent(selectedEvent)}>Edit</button>
                </div>
              </div>

              {/* Event meta */}
              <div className="card-body" style={{paddingBottom:0}}>
                <div className={s.eventMeta}>
                  {[['Sport', selectedEvent.sport],['Venue', selectedEvent.venue],['Date', fmt(selectedEvent.date)]].map(([l,v])=>(
                    <div key={l} className={s.metaItem}>
                      <span className={s.metaLabel}>{l}</span>
                      <span className={s.metaVal}>{v}</span>
                    </div>
                  ))}
                  {selectedEvent.notes && (
                    <div className={s.metaItem} style={{gridColumn:'1/-1'}}>
                      <span className={s.metaLabel}>Notes</span>
                      <span className={s.metaVal}>{selectedEvent.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-divider" style={{margin:'12px 18px'}}/>

              {/* Packing list header */}
              <div style={{padding:'0 18px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div className={s.packTitle}>Equipment Packing List</div>
                  {selectedEvent.packingList?.length > 0 && (
                    <div className={s.packProgress}>
                      {selectedEvent.packingList.filter(i=>i.packed).length} of {selectedEvent.packingList.length} issued / packed
                      <div className="prog-wrap" style={{width:80,marginLeft:8,display:'inline-block',verticalAlign:'middle'}}>
                        <div className="prog-fill" style={{
                          width:`${Math.round(selectedEvent.packingList.filter(i=>i.packed).length/selectedEvent.packingList.length*100)}%`,
                          background:'var(--ok)',
                        }}/>
                      </div>
                    </div>
                  )}
                </div>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => { setPackForm({equipmentId:'',qty:'1',notes:''}); setPackErrors({}); setPackModal(true) }}>
                  <Plus size={13}/> Add Item
                </button>
              </div>

              {/* Packing items */}
              {!selectedEvent.packingList?.length
                ? (
                  <div style={{padding:'8px 18px 18px'}}>
                    <div className={s.emptyPacking}>
                      <Package size={20} style={{opacity:.3}}/>
                      <span>No items added. Add equipment to pack for this event.</span>
                    </div>
                  </div>
                )
                : (
                  <div className={s.packList}>
                    {selectedEvent.packingList.map(item => {
                      const issuedCo = getIssuedCheckout(item)
                      return (
                        <div key={item.id} className={`${s.packItem} ${item.packed?s.packItemDone:''}`}>

                          {/* Check/uncheck */}
                          <button className={s.packCheck}
                            onClick={() => !issuedCo && togglePackingItemPacked(selectedId, item.id)}
                            title={issuedCo ? 'Issued via checkout' : item.packed ? 'Mark unpacked' : 'Mark packed'}>
                            {item.packed
                              ? <CheckSquare size={16} style={{color:'var(--ok)'}}/>
                              : <Square size={16} style={{color:'var(--text-3)'}}/>
                            }
                          </button>

                          {/* Item info */}
                          <div className={s.packItemInfo}>
                            <div className={s.packItemName}>{item.equipmentName}</div>
                            <div className={s.packItemMeta}>
                              <span>×{item.qty}</span>
                              {item.category && <span>{item.category}</span>}
                              {item.notes && <span className={s.packNote}>{item.notes}</span>}
                            </div>

                            {/* Issued checkout details */}
                            {issuedCo && (
                              <div className={s.issuedStrip}>
                                <CheckSquare size={11} style={{color:'var(--ok)',flexShrink:0}}/>
                                <span>Issued to <strong>{issuedCo.borrowerName}</strong></span>
                                <span className={s.issuedMeta}>{issuedCo.idNumber} · {issuedCo.phone}</span>
                                <span className={s.issuedMeta}>Due: {fmt(issuedCo.dueDate)}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className={s.packActions}>
                            {!issuedCo && !item.packed && (
                              <button className="btn btn-primary btn-sm"
                                onClick={() => openIssueModal(item)}
                                title="Issue this item to a person">
                                <ChevronRight size={12}/> Issue
                              </button>
                            )}
                            {issuedCo && (
                              <Badge className="badge-ok" style={{fontSize:9}}>Issued</Badge>
                            )}
                            <button className={s.packRemove}
                              onClick={() => removePackingItem(selectedId, item.id)}
                              title="Remove from list">
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              }
            </div>
          )
        }
      </div>

      {/* ── Add/Edit Event Modal ── */}
      <Modal open={eventModal} onClose={() => setEventModal(false)}
        title={editingEvent ? 'Edit Event' : 'Add Event'}
        subtitle={editingEvent ? editingEvent.name : 'New match, training or tournament'}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setEventModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveEvent}>{editingEvent ? 'Save Changes' : <><Plus size={14}/> Add Event</>}</button>
        </>}>
        <div className="form-group" style={{marginBottom:12}}>
          <label className="form-label">Event Name <span className="required">*</span></label>
          <input className="form-input" placeholder="e.g. U18 League Match vs Athi FC" value={eventForm.name} onChange={e=>setEF('name',e.target.value)}/>
          {eventErrors.name && <span style={{fontSize:11,color:'var(--danger)'}}>{eventErrors.name}</span>}
        </div>
        <div className="form-grid-2" style={{marginBottom:12}}>
          <div className="form-group">
            <label className="form-label">Date <span className="required">*</span></label>
            <input className="form-input" type="date" value={eventForm.date} onChange={e=>setEF('date',e.target.value)}/>
            {eventErrors.date && <span style={{fontSize:11,color:'var(--danger)'}}>{eventErrors.date}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={eventForm.type} onChange={e=>setEF('type',e.target.value)}>
              {EVENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid-2" style={{marginBottom:12}}>
          <div className="form-group">
            <label className="form-label">Sport <span className="required">*</span></label>
            <CategorySelect value={eventForm.sport} onChange={v=>setEF('sport',v)} placeholder="Select sport" error={eventErrors.sport}/>
          </div>
          <div className="form-group">
            <label className="form-label">Venue</label>
            <select className="form-select" value={eventForm.venue} onChange={e=>setEF('venue',e.target.value)}>
              {VENUE_OPTS.map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" placeholder="e.g. KO 3pm, meet at gate by 2pm" value={eventForm.notes} onChange={e=>setEF('notes',e.target.value)}/>
        </div>
      </Modal>

      {/* ── Add Packing Item Modal ── */}
      <Modal open={packModal} onClose={() => setPackModal(false)}
        title="Add to Packing List" subtitle={selectedEvent?.name} maxWidth={440}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setPackModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={savePacking}><Plus size={14}/> Add to List</button>
        </>}>
        <div className="form-group" style={{marginBottom:12}}>
          <label className="form-label">Equipment <span className="required">*</span></label>
          <select className="form-select" value={packForm.equipmentId} onChange={e=>setPF('equipmentId',e.target.value)}>
            <option value="">Select equipment...</option>
            {equipCats.map(cat=>(
              <optgroup key={cat} label={cat}>
                {equipment.filter(e=>e.category===cat).map(e=>(
                  <option key={e.id} value={e.id}>{e.name} ({e.available} available)</option>
                ))}
              </optgroup>
            ))}
          </select>
          {packErrors.equipmentId && <span style={{fontSize:11,color:'var(--danger)'}}>{packErrors.equipmentId}</span>}
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Quantity <span className="required">*</span></label>
            <input className="form-input" type="number" min="1" value={packForm.qty} onChange={e=>setPF('qty',e.target.value)}/>
            {packErrors.qty && <span style={{fontSize:11,color:'var(--danger)'}}>{packErrors.qty}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" placeholder="e.g. Spare only" value={packForm.notes} onChange={e=>setPF('notes',e.target.value)}/>
          </div>
        </div>
      </Modal>

      {/* ── Issue to Event Modal ── */}
      <Modal open={issueModal} onClose={() => setIssueModal(false)}
        title="Issue Equipment for Event"
        subtitle={issueItem ? `${issueItem.equipmentName} ×${issueItem.qty} — ${selectedEvent?.name}` : ''}
        maxWidth={500}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setIssueModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={confirmIssue}>
            <ChevronRight size={14}/> Confirm Issue
          </button>
        </>}>

        {/* Equipment summary */}
        {issueItem && (() => {
          const eq = equipment.find(e => String(e.id) === String(issueItem.equipmentId))
          return eq ? (
            <div style={{padding:'8px 12px',background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:8,marginBottom:14,fontSize:12}}>
              <strong>{eq.name}</strong> · Qty: <strong>{issueItem.qty}</strong> · Available: <strong style={{color: eq.available >= issueItem.qty ? 'var(--ok)' : 'var(--danger)'}}>{eq.available}</strong>
            </div>
          ) : null
        })()}

        <div className="form-section-label">Person In Charge</div>

        {/* Borrower search */}
        <div className="form-group" style={{marginBottom:10,position:'relative'}}>
          <label className="form-label">Search Existing Profile</label>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--surface-2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px'}}>
            <User size={14} style={{color:'var(--text-3)',flexShrink:0}}/>
            <input style={{background:'none',border:'none',outline:'none',color:'var(--text-1)',fontSize:13,fontFamily:'inherit',width:'100%'}}
              placeholder="Name, ID or phone..."
              value={issueForm.borrowerSearch}
              onChange={e => handleIssueSearch(e.target.value)}
              onBlur={() => setTimeout(()=>setShowIssueSug(false),160)}
              onFocus={() => issueSuggestions.length && setShowIssueSug(true)}
              autoComplete="off"/>
          </div>
          {showIssueSug && issueSuggestions.length > 0 && (
            <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'var(--surface)',border:'1px solid var(--border-2)',borderRadius:10,boxShadow:'var(--shadow-md)',zIndex:300,overflow:'hidden'}}>
              {issueSuggestions.map(b=>(
                <div key={b.id} style={{padding:'9px 14px',cursor:'pointer',borderBottom:'1px solid var(--border)'}} onMouseDown={()=>selectIssueBorrower(b)}>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--text-1)'}}>{b.name}</div>
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>{b.idNumber} · {b.phone} · {b.team}</div>
                </div>
              ))}
            </div>
          )}
          {issueForm.borrowerId && <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--ok)',marginTop:4,fontWeight:600}}><CheckSquare size={12}/> Profile loaded</div>}
        </div>

        <div style={{textAlign:'center',fontSize:11,color:'var(--text-3)',margin:'8px 0',position:'relative'}}>
          <span style={{background:'var(--surface)',padding:'0 10px',position:'relative'}}>or enter manually</span>
          <div style={{position:'absolute',top:'50%',left:0,right:0,height:1,background:'var(--border)',zIndex:-1}}/>
        </div>

        <div className="form-grid-2" style={{marginBottom:10}}>
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input className="form-input" placeholder="e.g. Peter Kamau" value={issueForm.borrowerName} onChange={e=>setIF('borrowerName',e.target.value)}/>
            {issueErrors.borrowerName && <span style={{fontSize:11,color:'var(--danger)'}}>{issueErrors.borrowerName}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">ID Number <span className="required">*</span></label>
            <input className="form-input" placeholder="e.g. KE-34521890" value={issueForm.idNumber} onChange={e=>setIF('idNumber',e.target.value)}/>
            {issueErrors.idNumber && <span style={{fontSize:11,color:'var(--danger)'}}>{issueErrors.idNumber}</span>}
          </div>
        </div>
        <div className="form-grid-2" style={{marginBottom:10}}>
          <div className="form-group">
            <label className="form-label">Phone <span className="required">*</span></label>
            <input className="form-input" placeholder="+254 7XX XXX XXX" value={issueForm.phone} onChange={e=>setIF('phone',e.target.value)}/>
            {issueErrors.phone && <span style={{fontSize:11,color:'var(--danger)'}}>{issueErrors.phone}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={issueForm.role} onChange={e=>setIF('role',e.target.value)}>
              <option>Player</option><option>Staff</option><option>Coach</option><option>Volunteer</option>
            </select>
          </div>
        </div>
        <div className="form-grid-2" style={{marginBottom:10}}>
          <div className="form-group">
            <label className="form-label">Team</label>
            <input className="form-input" placeholder="e.g. U18 A" value={issueForm.team} onChange={e=>setIF('team',e.target.value)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Return By <span className="required">*</span></label>
            <input className="form-input" type="date" value={issueForm.dueDate} onChange={e=>setIF('dueDate',e.target.value)}/>
            {issueErrors.dueDate && <span style={{fontSize:11,color:'var(--danger)'}}>{issueErrors.dueDate}</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" value={issueForm.notes} onChange={e=>setIF('notes',e.target.value)}/>
        </div>
      </Modal>
    </div>
  )
}

// ── Event row sub-component ──────────────────────────────────
function EventRow({ ev, selected, onSelect, onEdit, onDelete, countdownLabel, packProgress, past }) {
  const d    = new Date(ev.date)
  const cd   = countdownLabel(ev.date)
  const prog = packProgress(ev)
  return (
    <div className={`${s.eventRow} ${selected?s.eventRowSelected:''} ${past?s.eventRowPast:''}`} onClick={onSelect}>
      <div className={`${s.dateChip} ${!past && daysUntil(ev.date)<=3 && daysUntil(ev.date)>=0 ? s.dateChipSoon:''}`}>
        <span className={s.dateDay}>{d.getDate()}</span>
        <span className={s.dateMon}>{d.toLocaleDateString('en',{month:'short'})}</span>
      </div>
      <div className={s.eventInfo}>
        <div className={s.eventName}>{ev.name}</div>
        <div className={s.eventMeta2}>
          <span>{ev.sport}</span><span>·</span><span>{ev.venue}</span>
          {prog && <><span>·</span><span style={{color:prog.packed===prog.total?'var(--ok)':'var(--text-3)'}}>{prog.packed}/{prog.total} packed</span></>}
        </div>
      </div>
      <div className={s.eventRight}>
        <Badge className={EVENT_TYPE_BADGE[ev.type]||'badge-neutral'}>{ev.type}</Badge>
        <span className={cd.cls}>{cd.text}</span>
      </div>
      <div className={s.eventActions} onClick={e=>e.stopPropagation()}>
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}><Trash2 size={12}/></button>
      </div>
    </div>
  )
}
