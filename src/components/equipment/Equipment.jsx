import { useState, useEffect } from 'react'
import { Plus, Edit2, ArrowRightLeft, Package, Trash2 } from 'lucide-react'
import { Modal }           from '../ui/Modal.jsx'
import { Badge }           from '../ui/Badge.jsx'
import { EmptyState }      from '../ui/EmptyState.jsx'
import { CategorySelect }  from '../ui/CategorySelect.jsx'
import { useData }         from '../../context/DataContext.jsx'
import { useApp }          from '../../context/AppContext.jsx'
import { catStyle, STATUS_BADGE, CONDITION_BADGE, CONDITIONS } from '../../utils/constants.js'
import s from './Equipment.module.css'

const EMPTY_FORM = {
  name: '', category: '', total: '', minStock: '2', condition: 'Good', notes: '',
}

export function Equipment({ onNavigate, searchValue, onRegisterCta }) {
  const { equipment, categories, addEquipment, updateEquipment, deleteEquipment } = useData()
  const { showToast } = useApp()

  const [catFilter,    setCatFilter]    = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [errors,       setErrors]       = useState({})

  // Register the topbar CTA
  useEffect(() => { onRegisterCta?.(() => openAdd()) }, [onRegisterCta])

  const filtered = equipment.filter(e => {
    const q   = searchValue?.toLowerCase() || ''
    const ms  = !q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    const mc  = !catFilter    || e.category === catFilter
    const mst = !statusFilter || e.status   === statusFilter
    return ms && mc && mst
  })

  // Build category list from live equipment for the filter dropdown
  const activeCats = [...new Set(equipment.map(e => e.category))].sort()

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true)
  }
  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name:      item.name,
      category:  item.category,
      total:     String(item.total),
      minStock:  String(item.minStock),
      condition: item.condition,
      notes:     item.notes || '',
    })
    setErrors({}); setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())                                     e.name     = 'Required'
    if (!form.category)                                        e.category = 'Required'
    if (!form.total || isNaN(Number(form.total)) || Number(form.total) < 1)
                                                               e.total    = 'Enter a valid quantity'
    return e
  }

  const save = () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const data = {
      name:      form.name.trim(),
      category:  form.category,
      total:     Number(form.total),
      minStock:  Number(form.minStock) || 2,
      condition: form.condition,
      notes:     form.notes.trim(),
    }

    if (editing) {
      updateEquipment(editing.id, data)
      showToast('ok', 'Equipment updated', data.name)
    } else {
      addEquipment(data)
      showToast('ok', 'Equipment added', `${data.name} · Qty: ${data.total}`)
    }
    setModalOpen(false)
  }

  const setF = (field, val) => {
    setForm(p => ({ ...p, [field]: val }))
    setErrors(p => ({ ...p, [field]: '' }))
  }

  const stockClass = (avail, min) =>
    avail === 0 ? s.stockDanger : avail <= min ? s.stockWarn : s.stockOk

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className={s.filterBar}>
        <select
          className="form-select"
          style={{ width: 160 }}
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {activeCats.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 150 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="In Store">In Store</option>
          <option value="Checked Out">Checked Out</option>
          <option value="Under Repair">Under Repair</option>
          <option value="Lost">Lost</option>
        </select>

        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 4 }}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </span>

      </div>

      {/* ── Table ── */}
      <div className="card">
        {filtered.length === 0
          ? (
            <EmptyState
              icon={<Package size={32} />}
              title="No equipment found"
              subtitle="Try adjusting your filters or add new equipment."
            />
          )
          : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Sport / Category</th>
                    <th>Total</th>
                    <th>Available</th>
                    <th>Min</th>
                    <th>Condition</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const cs = catStyle(item.category)
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</td>
                        <td>
                          <span
                            className={s.catChip}
                            style={{ background: cs.bg, color: cs.text }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.total}</td>
                        <td>
                          <span className={`${s.stockNum} ${stockClass(item.available, item.minStock)}`}>
                            {item.available}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-3)', fontSize: 11 }}>{item.minStock}</td>
                        <td>
                          <Badge className={CONDITION_BADGE[item.condition] || 'badge-neutral'}>
                            {item.condition}
                          </Badge>
                        </td>
                        <td>
                          <Badge className={STATUS_BADGE[item.status] || 'badge-neutral'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td
                          style={{ color: 'var(--text-3)', fontSize: 11, maxWidth: 160 }}
                          className="truncate"
                          title={item.notes}
                        >
                          {item.notes || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEdit(item)}
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              className="btn btn-ok btn-sm"
                              onClick={() => onNavigate('checkout')}
                              disabled={item.available === 0}
                              title="Issue"
                            >
                              <ArrowRightLeft size={12} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Delete equipment"
                              onClick={() => {
                                if (window.confirm(`Delete "${item.name}" from inventory?`))
                                  deleteEquipment(item.id)
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Equipment' : 'Add Equipment'}
        subtitle={editing ? `Editing: ${editing.name}` : 'Register a new item in the inventory'}
        maxWidth={520}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Save Changes' : 'Add Equipment'}
            </button>
          </>
        }
      >
        {/* Name */}
        <div className="form-section-label">Item Info</div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Equipment Name <span className="required">*</span></label>
          <input
            className="form-input"
            placeholder="e.g. Match Football (Size 5)"
            value={form.name}
            onChange={e => setF('name', e.target.value)}
          />
          {errors.name && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.name}</span>}
        </div>

        {/* Category — full-width CategorySelect */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Sport / Category <span className="required">*</span></label>
          <CategorySelect
            value={form.category}
            onChange={val => setF('category', val)}
            placeholder="Select or add a category"
            error={errors.category}
          />
        </div>

        {/* Stock */}
        <div className="form-divider" />
        <div className="form-section-label">Stock</div>
        <div className="form-grid-2" style={{ marginBottom: 12 }}>
          <div className="form-group">
            <label className="form-label">Total Quantity <span className="required">*</span></label>
            <input
              className="form-input"
              type="number" min="1"
              placeholder="0"
              value={form.total}
              onChange={e => setF('total', e.target.value)}
            />
            {errors.total && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{errors.total}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Min Stock Threshold</label>
            <input
              className="form-input"
              type="number" min="0"
              placeholder="2"
              value={form.minStock}
              onChange={e => setF('minStock', e.target.value)}
            />
          </div>
        </div>

        {/* Condition & Notes */}
        <div className="form-divider" />
        <div className="form-section-label">Condition & Notes</div>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Condition</label>
            <select
              className="form-select"
              value={form.condition}
              onChange={e => setF('condition', e.target.value)}
            >
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input
              className="form-input"
              placeholder="Optional notes"
              value={form.notes}
              onChange={e => setF('notes', e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
