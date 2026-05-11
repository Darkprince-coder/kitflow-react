import { useState, useEffect } from 'react'
import { Plus, Trash2, Package, CheckSquare, Square, CalendarDays, ChevronRight } from 'lucide-react'
import { Modal }           from '../ui/Modal.jsx'
import { Badge }           from '../ui/Badge.jsx'
import { EmptyState }      from '../ui/EmptyState.jsx'
import { CategorySelect }  from '../ui/CategorySelect.jsx'
import { useData }         from '../../context/DataContext.jsx'
import { useApp }          from '../../context/AppContext.jsx'
import { fmt, fmtShort, daysUntil } from '../../utils/date.js'
import { EVENT_TYPE_BADGE, EVENT_TYPES } from '../../utils/constants.js'
import s from './Calendar.module.css'

const EMPTY_EVENT_FORM = {
  name: '', date: '', type: 'Match', sport: '', venue: 'Home', notes: '',
}

const VENUE_OPTS = ['Home', 'Away', 'Neutral']

export function CalendarPage({ onRegisterCta }) {
  const {
    equipment, events, categories,
    addEvent, updateEvent, deleteEvent,
    addPackingItem, removePackingItem, togglePackingItemPacked,
  } = useData()
  const { showToast } = useApp()

  const [eventModal,    setEventModal]    = useState(false)
  const [editingEvent,  setEditingEvent]  = useState(null)
  const [eventForm,     setEventForm]     = useState(EMPTY_EVENT_FORM)
  const [eventErrors,   setEventErrors]   = useState({})
  const [selectedId,    setSelectedId]    = useState(null)
  const [packingModal,  setPackingModal]  = useState(false)
  const [packForm,      setPackForm]      = useState({ equipmentId: '', qty: '1', notes: '' })
  const [packErrors,    setPackErrors]    = useState({})
  const [typeFilter,    setTypeFilter]    = useState('')
  const [showPast,      setShowPast]      = useState(false)

  useEffect(() => { onRegisterCta?.(() => openAddEvent()) }, [onRegisterCta])

  // ── Sort + filter events ─────────────────────────────────
  const now = new Date()
  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date))
  const upcoming = sorted.filter(e => new Date(e.date) >= now || daysUntil(e.date) === 0)
  const past     = sorted.filter(e => new Date(e.date) < now  && daysUntil(e.date) < 0)

  const filterEvents = (list) =>
    list.filter(e => !typeFilter || e.type === typeFilter)

  const selectedEvent = events.find(e => e.id === selectedId)

  // ── Event CRUD ───────────────────────────────────────────
  const openAddEvent = () => {
    setEditingEvent(null)
    setEventForm(EMPTY_EVENT_FORM)
    setEventErrors({})
    setEventModal(true)
  }
  const openEditEvent = (ev) => {
    setEditingEvent(ev)
    setEventForm({
      name: ev.name, date: ev.date, type: ev.type,
      sport: ev.sport, venue: ev.venue, notes: ev.notes || '',
    })
    setEventErrors({})
    setEventModal(true)
  }

  const validateEvent = () => {
    const e = {}
    if (!eventForm.name.trim()) e.name = 'Required'
    if (!eventForm.date)        e.date = 'Required'
    if (!eventForm.sport)       e.sport = 'Select a sport / category'
    return e
  }

  const saveEvent = () => {
    const errs = validateEvent()
    if (Object.keys(errs).length) { setEventErrors(errs); return }
    const data = {
      name:  eventForm.name.trim(),
      date:  eventForm.date,
      type:  eventForm.type,
      sport: eventForm.sport,
      venue: eventForm.venue,
      notes: eventForm.notes.trim(),
    }
    if (editingEvent) {
      updateEvent(editingEvent.id, data)
      showToast('ok', 'Event updated', data.name)
    } else {
      const ev = addEvent(data)
      setSelectedId(ev.id)
      showToast('ok', 'Event added', data.name)
    }
    setEventModal(false)
  }

  const handleDeleteEvent = (id) => {
    deleteEvent(id)
    if (selectedId === id) setSelectedId(null)
    showToast('ok', 'Event deleted')
  }

  // ── Packing list ─────────────────────────────────────────
  const validatePack = () => {
    const e = {}
    if (!packForm.equipmentId)                                    e.equipmentId = 'Select equipment'
    if (!packForm.qty || isNaN(Number(packForm.qty)) || Number(packForm.qty) < 1)
                                                                  e.qty         = 'Enter quantity'
    return e
  }

  const savePacking = () => {
    const errs = validatePack()
    if (Object.keys(errs).length) { setPackErrors(errs); return }
    const eq = equipment.find(e => e.id === Number(packForm.equipmentId))
    addPackingItem(selectedId, {
      equipmentId:   Number(packForm.equipmentId),
      equipmentName: eq?.name || '',
      category:      eq?.category || '',
      qty:           Number(packForm.qty),
      notes:         packForm.notes.trim(),
    })
    showToast('ok', 'Added to packing list', eq?.name)
    setPackForm({ equipmentId: '', qty: '1', notes: '' })
    setPackErrors({})
    setPackingModal(false)
  }

  const setEF  = (f, v) => { setEventForm(p => ({ ...p, [f]: v })); setEventErrors(p => ({ ...p, [f]: '' })) }
  const setPF  = (f, v) => { setPackForm(p => ({ ...p, [f]: v })); setPackErrors(p => ({ ...p, [f]: '' })) }

  const equipCats = [...new Set(equipment.map(e => e.category))].sort()

  // Countdown label
  const countdownLabel = (date) => {
    const d = daysUntil(date)
    if (d < 0)   return { text: `${Math.abs(d)}d ago`, cls: s.pastLabel }
    if (d === 0) return { text: 'Today',               cls: s.todayLabel }
    if (d === 1) return { text: 'Tomorrow',            cls: s.soonLabel  }
    if (d <= 7)  return { text: `In ${d} days`,        cls: s.soonLabel  }
    return               { text: fmt(date, 'd MMM'),   cls: s.futureLabel }
  }

  const packProgress = (ev) => {
    if (!ev.packingList?.length) return null
    const packed = ev.packingList.filter(i => i.packed).length
    return { packed, total: ev.packingList.length }
  }

  return (
    <div className={s.layout}>

      {/* ══ LEFT — event list ══ */}
      <div className={s.listCol}>

        {/* Filter bar */}
        <div className={s.filterBar}>
          <select
            className="form-select"
            style={{ width: 160 }}
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button
            className={`btn btn-ghost btn-sm ${showPast ? s.pastToggleActive : ''}`}
            onClick={() => setShowPast(p => !p)}
          >
            {showPast ? 'Hide past' : 'Show past'}
          </button>

          <button
            className="btn btn-primary btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={openAddEvent}
          >
            <Plus size={14} /> Add Event
          </button>
        </div>

        {/* Upcoming events */}
        <div className={s.sectionLabel}>
          Upcoming — {filterEvents(upcoming).length} event{filterEvents(upcoming).length !== 1 ? 's' : ''}
        </div>

        <div className="card mb-3">
          {filterEvents(upcoming).length === 0
            ? <EmptyState
                icon={<CalendarDays size={28} />}
                title="No upcoming events"
                subtitle="Add a match, training session or tournament."
                action={
                  <button className="btn btn-primary btn-sm" onClick={openAddEvent}>
                    <Plus size={13} /> Add Event
                  </button>
                }
              />
            : filterEvents(upcoming).map(ev => (
              <EventRow
                key={ev.id}
                ev={ev}
                selected={selectedId === ev.id}
                onSelect={() => setSelectedId(id => id === ev.id ? null : ev.id)}
                onEdit={() => openEditEvent(ev)}
                onDelete={() => handleDeleteEvent(ev.id)}
                countdownLabel={countdownLabel}
                packProgress={packProgress}
              />
            ))
          }
        </div>

        {/* Past events */}
        {showPast && filterEvents(past).length > 0 && (
          <>
            <div className={s.sectionLabel} style={{ opacity: 0.6 }}>
              Past — {filterEvents(past).length} event{filterEvents(past).length !== 1 ? 's' : ''}
            </div>
            <div className="card" style={{ opacity: 0.7 }}>
              {filterEvents(past).map(ev => (
                <EventRow
                  key={ev.id}
                  ev={ev}
                  selected={selectedId === ev.id}
                  onSelect={() => setSelectedId(id => id === ev.id ? null : ev.id)}
                  onEdit={() => openEditEvent(ev)}
                  onDelete={() => handleDeleteEvent(ev.id)}
                  countdownLabel={countdownLabel}
                  packProgress={packProgress}
                  past
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══ RIGHT — event detail + packing list ══ */}
      <div className={s.detailCol}>
        {!selectedEvent
          ? (
            <div className="card">
              <EmptyState
                icon={<Package size={28} />}
                title="Select an event"
                subtitle="Click any event to view details and manage its equipment packing list."
              />
            </div>
          )
          : (
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">{selectedEvent.name}</div>
                  <div className="card-sub">
                    {fmt(selectedEvent.date)} · {selectedEvent.venue}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge className={EVENT_TYPE_BADGE[selectedEvent.type] || 'badge-neutral'}>
                    {selectedEvent.type}
                  </Badge>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditEvent(selectedEvent)}>
                    Edit
                  </button>
                </div>
              </div>

              {/* Event meta */}
              <div className="card-body" style={{ paddingBottom: 0 }}>
                <div className={s.eventMeta}>
                  <div className={s.metaItem}>
                    <span className={s.metaLabel}>Sport</span>
                    <span className={s.metaVal}>{selectedEvent.sport}</span>
                  </div>
                  <div className={s.metaItem}>
                    <span className={s.metaLabel}>Venue</span>
                    <span className={s.metaVal}>{selectedEvent.venue}</span>
                  </div>
                  <div className={s.metaItem}>
                    <span className={s.metaLabel}>Date</span>
                    <span className={s.metaVal}>{fmt(selectedEvent.date)}</span>
                  </div>
                  {selectedEvent.notes && (
                    <div className={s.metaItem} style={{ gridColumn: '1 / -1' }}>
                      <span className={s.metaLabel}>Notes</span>
                      <span className={s.metaVal}>{selectedEvent.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-divider" style={{ margin: '12px 18px' }} />

              {/* Packing list header */}
              <div style={{ padding: '0 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className={s.packTitle}>Equipment Packing List</div>
                  {selectedEvent.packingList?.length > 0 && (
                    <div className={s.packProgress}>
                      {selectedEvent.packingList.filter(i => i.packed).length} of {selectedEvent.packingList.length} packed
                      <div className="prog-wrap" style={{ width: 80, marginLeft: 8, display: 'inline-block', verticalAlign: 'middle' }}>
                        <div
                          className="prog-fill"
                          style={{
                            width: `${Math.round(selectedEvent.packingList.filter(i => i.packed).length / selectedEvent.packingList.length * 100)}%`,
                            background: 'var(--ok)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setPackForm({ equipmentId: '', qty: '1', notes: '' }); setPackErrors({}); setPackingModal(true) }}
                >
                  <Plus size={13} /> Add Item
                </button>
              </div>

              {/* Packing items */}
              {!selectedEvent.packingList?.length
                ? (
                  <div style={{ padding: '8px 18px 18px' }}>
                    <div className={s.emptyPacking}>
                      <Package size={20} style={{ opacity: 0.3 }} />
                      <span>No items added yet. Add equipment to pack for this event.</span>
                    </div>
                  </div>
                )
                : (
                  <div className={s.packList}>
                    {selectedEvent.packingList.map(item => (
                      <div key={item.id} className={`${s.packItem} ${item.packed ? s.packItemDone : ''}`}>
                        <button
                          className={s.packCheck}
                          onClick={() => togglePackingItemPacked(selectedId, item.id)}
                          title={item.packed ? 'Mark unpacked' : 'Mark packed'}
                        >
                          {item.packed
                            ? <CheckSquare size={16} style={{ color: 'var(--ok)' }} />
                            : <Square size={16} style={{ color: 'var(--text-3)' }} />
                          }
                        </button>
                        <div className={s.packItemInfo}>
                          <span className={s.packItemName}>{item.equipmentName}</span>
                          <div className={s.packItemMeta}>
                            <span>×{item.qty}</span>
                            {item.category && <span>{item.category}</span>}
                            {item.notes && <span className={s.packNote}>{item.notes}</span>}
                          </div>
                        </div>
                        <button
                          className={s.packRemove}
                          onClick={() => removePackingItem(selectedId, item.id)}
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          )
        }
      </div>

      {/* ── Add / Edit Event Modal ── */}
      <Modal
        open={eventModal}
        onClose={() => setEventModal(false)}
        title={editingEvent ? 'Edit Event' : 'Add Event'}
        subtitle={editingEvent ? editingEvent.name : 'New match, training or tournament'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEventModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEvent}>
              {editingEvent ? 'Save Changes' : <><Plus size={14} /> Add Event</>}
            </button>
          </>
        }
      >
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Event Name <span className="required">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. U18 League Match vs Athi FC"
            value={eventForm.name}
            onChange={e => setEF('name', e.target.value)}
          />
          {eventErrors.name && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{eventErrors.name}</span>}
        </div>

        <div className="form-grid-2" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Date <span className="required">*</span></label>
            <input
              className="form-input"
              type="date"
              value={eventForm.date}
              onChange={e => setEF('date', e.target.value)}
            />
            {eventErrors.date && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{eventErrors.date}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={eventForm.type}
              onChange={e => setEF('type', e.target.value)}
            >
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-grid-2" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Sport / Category <span className="required">*</span></label>
            <CategorySelect
              value={eventForm.sport}
              onChange={val => setEF('sport', val)}
              placeholder="Select sport"
              error={eventErrors.sport}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Venue</label>
            <select
              className="form-select"
              value={eventForm.venue}
              onChange={e => setEF('venue', e.target.value)}
            >
              {VENUE_OPTS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <input
            className="form-input"
            placeholder="e.g. KO 3pm, meet at gate by 2pm"
            value={eventForm.notes}
            onChange={e => setEF('notes', e.target.value)}
          />
        </div>
      </Modal>

      {/* ── Add Packing Item Modal ── */}
      <Modal
        open={packingModal}
        onClose={() => setPackingModal(false)}
        title="Add to Packing List"
        subtitle={selectedEvent?.name}
        maxWidth={440}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setPackingModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={savePacking}>
              <Plus size={14} /> Add to List
            </button>
          </>
        }
      >
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Equipment <span className="required">*</span></label>
          <select
            className="form-select"
            value={packForm.equipmentId}
            onChange={e => setPF('equipmentId', e.target.value)}
          >
            <option value="">Select equipment...</option>
            {equipCats.map(cat => (
              <optgroup key={cat} label={cat}>
                {equipment
                  .filter(e => e.category === cat)
                  .map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.available} available)
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {packErrors.equipmentId && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{packErrors.equipmentId}</span>}
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Quantity <span className="required">*</span></label>
            <input
              className="form-input"
              type="number" min="1"
              value={packForm.qty}
              onChange={e => setPF('qty', e.target.value)}
            />
            {packErrors.qty && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{packErrors.qty}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input
              className="form-input"
              placeholder="e.g. Spare only"
              value={packForm.notes}
              onChange={e => setPF('notes', e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Event row sub-component ─────────────────────────────────
function EventRow({ ev, selected, onSelect, onEdit, onDelete, countdownLabel, packProgress, past }) {
  const d    = new Date(ev.date)
  const cd   = countdownLabel(ev.date)
  const prog = packProgress(ev)

  return (
    <div
      className={`${s.eventRow} ${selected ? s.eventRowSelected : ''} ${past ? s.eventRowPast : ''}`}
      onClick={onSelect}
    >
      {/* Date chip */}
      <div className={`${s.dateChip} ${!past && daysUntil(ev.date) <= 3 && daysUntil(ev.date) >= 0 ? s.dateChipSoon : ''}`}>
        <span className={s.dateDay}>{d.getDate()}</span>
        <span className={s.dateMon}>{d.toLocaleDateString('en', { month: 'short' })}</span>
      </div>

      <div className={s.eventInfo}>
        <div className={s.eventName}>{ev.name}</div>
        <div className={s.eventMeta2}>
          <span>{ev.sport}</span>
          <span>·</span>
          <span>{ev.venue}</span>
          {prog && (
            <>
              <span>·</span>
              <span style={{ color: prog.packed === prog.total ? 'var(--ok)' : 'var(--text-3)' }}>
                {prog.packed}/{prog.total} packed
              </span>
            </>
          )}
        </div>
      </div>

      <div className={s.eventRight}>
        <Badge className={EVENT_TYPE_BADGE[ev.type] || 'badge-neutral'}>{ev.type}</Badge>
        <span className={cd.cls}>{cd.text}</span>
      </div>

      {/* Action buttons — shown on hover via CSS */}
      <div className={s.eventActions} onClick={e => e.stopPropagation()}>
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
