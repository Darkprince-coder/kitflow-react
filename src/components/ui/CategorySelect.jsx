import { useState, useRef, useEffect } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { catStyle } from '../../utils/constants.js'
import s from './CategorySelect.module.css'

/**
 * CategorySelect
 * Drop-in replacement for a plain <select> for equipment categories.
 * Renders a styled button that opens a dropdown list.
 * Bottom of list has an "Add category" row with an inline text input.
 *
 * Props:
 *   value       – current selected category string
 *   onChange    – (newValue: string) => void
 *   placeholder – string shown when nothing selected
 *   error       – optional error string
 */
export function CategorySelect({ value, onChange, placeholder = 'Select category', error }) {
  const { categories, addCategory } = useData()
  const [open,       setOpen]       = useState(false)
  const [adding,     setAdding]     = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [addErr,     setAddErr]     = useState('')
  const wrapRef  = useRef()
  const inputRef = useRef()

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setAdding(false)
        setNewCatName('')
        setAddErr('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus input when adding row opens
  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const select = (cat) => {
    onChange(cat)
    setOpen(false)
    setAdding(false)
    setNewCatName('')
  }

  const confirmAdd = () => {
    const trimmed = newCatName.trim()
    if (!trimmed) { setAddErr('Enter a category name'); return }
    if (categories.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setAddErr('Already exists'); return
    }
    const ok = addCategory(trimmed)
    if (ok) {
      onChange(trimmed)
      setOpen(false)
      setAdding(false)
      setNewCatName('')
      setAddErr('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); confirmAdd() }
    if (e.key === 'Escape') { setAdding(false); setNewCatName(''); setAddErr('') }
  }

  const cs = value ? catStyle(value) : null

  return (
    <div className={s.wrap} ref={wrapRef}>
      {/* Trigger button */}
      <button
        type="button"
        className={`${s.trigger} ${error ? s.triggerError : ''} ${open ? s.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {value
          ? (
            <span className={s.chipInTrigger} style={{ background: cs.bg, color: cs.text }}>
              {value}
            </span>
          )
          : <span className={s.placeholder}>{placeholder}</span>
        }
        <svg
          className={`${s.chevron} ${open ? s.chevronOpen : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {error && <span className={s.errText}>{error}</span>}

      {/* Dropdown */}
      {open && (
        <div className={s.dropdown}>
          <div className={s.dropList}>
            {categories.map(cat => {
              const cs2 = catStyle(cat)
              return (
                <div
                  key={cat}
                  className={`${s.dropItem} ${value === cat ? s.dropItemActive : ''}`}
                  onClick={() => select(cat)}
                >
                  <span className={s.chip} style={{ background: cs2.bg, color: cs2.text }}>
                    {cat}
                  </span>
                  {value === cat && <Check size={13} className={s.checkIcon} />}
                </div>
              )
            })}
          </div>

          {/* Add category row */}
          <div className={s.addRow}>
            {!adding
              ? (
                <button
                  type="button"
                  className={s.addBtn}
                  onClick={() => setAdding(true)}
                >
                  <Plus size={13} />
                  Add new category
                </button>
              )
              : (
                <div className={s.addInputRow}>
                  <input
                    ref={inputRef}
                    className={s.addInput}
                    placeholder="e.g. Swimming"
                    value={newCatName}
                    onChange={e => { setNewCatName(e.target.value); setAddErr('') }}
                    onKeyDown={handleKeyDown}
                    maxLength={40}
                  />
                  <button type="button" className={s.addConfirm} onClick={confirmAdd} title="Add">
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    className={s.addCancel}
                    onClick={() => { setAdding(false); setNewCatName(''); setAddErr('') }}
                    title="Cancel"
                  >
                    <X size={13} />
                  </button>
                  {addErr && <span className={s.addErr}>{addErr}</span>}
                </div>
              )
            }
          </div>
        </div>
      )}
    </div>
  )
}
