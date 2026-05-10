import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { addDays } from 'date-fns'
import { DEFAULT_CATEGORIES } from '../utils/constants.js'
import { db } from '../lib/db.js'
import { useSupabase } from '../hooks/useSupabase.js'

// ── Date helpers (seed data only) ─────────────────────────────
const daysFromNow = (n) => addDays(new Date(), n).toISOString().split('T')[0]

// ── Seed Equipment ─────────────────────────────────────────────
const SEED_EQUIPMENT = [
  { id:'eq-1',  name:'Match Football (Size 5)',       category:'Football',  total:20, available:14, condition:'Good', status:'In Store',    minStock:5, notes:'' },
  { id:'eq-2',  name:'Training Football (Size 4)',    category:'Football',  total:15, available:10, condition:'Fair', status:'In Store',    minStock:4, notes:'Some surface wear' },
  { id:'eq-3',  name:'Training Football (Size 3)',    category:'Football',  total:10, available:8,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:'eq-4',  name:'Goalkeeper Gloves (Pair)',      category:'Football',  total:12, available:9,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:'eq-5',  name:'Goalkeeper Jersey (Set of 3)', category:'Football',  total:6,  available:4,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:'eq-6',  name:'Shin Guards (Pair)',            category:'Football',  total:30, available:0,  condition:'Good', status:'Checked Out', minStock:8, notes:'' },
  { id:'eq-7',  name:'Training Bibs (Set of 20)',     category:'Football',  total:8,  available:5,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:'eq-8',  name:'Training Cones (Set of 50)',    category:'Football',  total:10, available:7,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:'eq-9',  name:'Goal Net — Full Size (Pair)',   category:'Football',  total:4,  available:3,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
  { id:'eq-10', name:'Pop-Up Goals (Set of 4)',       category:'Football',  total:6,  available:4,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:'eq-11', name:'Rugby Ball (Size 5)',           category:'Rugby',     total:12, available:9,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:'eq-12', name:'Rugby Ball (Size 4)',           category:'Rugby',     total:8,  available:6,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:'eq-13', name:'Rugby Tackle Pads',             category:'Rugby',     total:10, available:7,  condition:'Fair', status:'In Store',    minStock:3, notes:'' },
  { id:'eq-14', name:'Rugby Scrum Cap',               category:'Rugby',     total:20, available:15, condition:'Good', status:'In Store',    minStock:5, notes:'' },
  { id:'eq-15', name:'Rugby Tackle Shield',           category:'Rugby',     total:8,  available:0,  condition:'Poor', status:'Under Repair',minStock:2, notes:'Straps broken' },
  { id:'eq-16', name:'Netball (Size 5)',              category:'Netball',   total:15, available:11, condition:'Good', status:'In Store',    minStock:4, notes:'' },
  { id:'eq-17', name:'Netball Bibs (Set of 14)',      category:'Netball',   total:6,  available:4,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:'eq-18', name:'Volleyball (Indoor)',           category:'Volleyball',total:10, available:7,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:'eq-19', name:'Volleyball Net (Full Size)',    category:'Volleyball',total:3,  available:2,  condition:'Fair', status:'In Store',    minStock:1, notes:'' },
  { id:'eq-20', name:'Volleyball Knee Pads (Pair)',   category:'Volleyball',total:20, available:14, condition:'Good', status:'In Store',    minStock:5, notes:'' },
  { id:'eq-21', name:'Badminton Racket',              category:'Badminton', total:24, available:18, condition:'Good', status:'In Store',    minStock:6, notes:'' },
  { id:'eq-22', name:'Badminton Shuttlecocks (Tube)', category:'Badminton', total:20, available:13, condition:'Good', status:'In Store',    minStock:5, notes:'' },
  { id:'eq-23', name:'Badminton Net',                 category:'Badminton', total:4,  available:3,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
  { id:'eq-24', name:'Tennis Racket',                 category:'Tennis',    total:16, available:12, condition:'Good', status:'In Store',    minStock:4, notes:'' },
  { id:'eq-25', name:'Tennis Balls (Can of 3)',       category:'Tennis',    total:18, available:11, condition:'Good', status:'In Store',    minStock:4, notes:'' },
  { id:'eq-26', name:'Tennis Net',                    category:'Tennis',    total:2,  available:2,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
  { id:'eq-27', name:'First Aid Kit',                 category:'Medical',   total:4,  available:3,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:'eq-28', name:'Ice Packs (Box of 20)',         category:'Medical',   total:6,  available:4,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:'eq-29', name:'Coaching Whiteboard',           category:'General',   total:3,  available:2,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
  { id:'eq-30', name:'Pump & Needle Kit',             category:'General',   total:3,  available:0,  condition:'Poor', status:'Under Repair',minStock:1, notes:'Compressor faulty' },
]

const SEED_BORROWERS = [
  { id:'B001', name:'James Omondi',   idNumber:'KE-34521890', phone:'+254712345678', emergency:'+254700111222', role:'Player', team:'U18 A',      joinDate:'2023-08-01', notes:'' },
  { id:'B002', name:'Brian Ndegwa',   idNumber:'KE-28765432', phone:'+254723456789', emergency:'+254700222333', role:'Player', team:'U18 A',      joinDate:'2023-08-01', notes:'' },
  { id:'B003', name:'Kevin Lekuton',  idNumber:'KE-19843201', phone:'+254734567890', emergency:'+254700333444', role:'Player', team:'U16 B',      joinDate:'2024-01-15', notes:'' },
  { id:'B004', name:'Grace Wanjiku',  idNumber:'KE-45612387', phone:'+254745678901', emergency:'+254700444555', role:'Player', team:'Netball A',  joinDate:'2024-01-15', notes:'' },
  { id:'B005', name:'Peter Kamau',    idNumber:'KE-31290087', phone:'+254756789012', emergency:'+254700555666', role:'Staff',  team:'All',        joinDate:'2022-06-01', notes:'Head Coach' },
  { id:'B006', name:'Diana Achieng',  idNumber:'KE-52109834', phone:'+254767890123', emergency:'+254700666777', role:'Coach',  team:'All',        joinDate:'2022-06-01', notes:'Assistant Coach' },
  { id:'B007', name:'Samuel Oduya',   idNumber:'KE-40987612', phone:'+254778901234', emergency:'+254700777888', role:'Player', team:'U14 A',      joinDate:'2024-09-01', notes:'' },
  { id:'B008', name:'Collins Otieno', idNumber:'KE-37654920', phone:'+254789012345', emergency:'+254700888999', role:'Player', team:'Rugby U18',  joinDate:'2024-09-01', notes:'' },
  { id:'B009', name:'Aisha Mwangi',   idNumber:'KE-60123456', phone:'+254790123456', emergency:'+254700999000', role:'Player', team:'Volleyball A',joinDate:'2025-01-10',notes:'' },
  { id:'B010', name:'Tom Rotich',     idNumber:'KE-55678901', phone:'+254701234567', emergency:'+254700001111', role:'Player', team:'Badminton',  joinDate:'2025-03-01', notes:'' },
]

const SEED_CHECKOUTS = [
  { id:'CO001', equipmentId:'eq-6',  equipmentName:'Shin Guards (Pair)',   borrowerId:'B001', borrowerName:'James Omondi',  idNumber:'KE-34521890', phone:'+254712345678', qty:30, issuedAt:new Date(Date.now()-6*86400000).toISOString(), issuedDate:daysFromNow(-6), dueDate:daysFromNow(-1), returnedDate:null, coach:'Peter Kamau', team:'U18 A',      notes:'Pre-season training', status:'Active', returnLines:[] },
  { id:'CO002', equipmentId:'eq-7',  equipmentName:'Training Bibs (Set)', borrowerId:'B005', borrowerName:'Peter Kamau',   idNumber:'KE-31290087', phone:'+254756789012', qty:3,  issuedAt:new Date(Date.now()-2*86400000).toISOString(), issuedDate:daysFromNow(-2), dueDate:daysFromNow(3),  returnedDate:null, coach:'Peter Kamau', team:'U16 A',      notes:'Match day',           status:'Active', returnLines:[] },
  { id:'CO003', equipmentId:'eq-16', equipmentName:'Netball (Size 5)',     borrowerId:'B004', borrowerName:'Grace Wanjiku', idNumber:'KE-45612387', phone:'+254745678901', qty:4,  issuedAt:new Date(Date.now()-1*86400000).toISOString(), issuedDate:daysFromNow(-1), dueDate:daysFromNow(5),  returnedDate:null, coach:'Diana Achieng', team:'Netball A', notes:'League practice',      status:'Active', returnLines:[] },
  { id:'CO004', equipmentId:'eq-21', equipmentName:'Badminton Racket',     borrowerId:'B010', borrowerName:'Tom Rotich',   idNumber:'KE-55678901', phone:'+254701234567', qty:6,  issuedAt:new Date(Date.now()-3*86400000).toISOString(), issuedDate:daysFromNow(-3), dueDate:daysFromNow(4),  returnedDate:null, coach:'Peter Kamau', team:'Badminton',  notes:'Tournament prep',      status:'Active', returnLines:[] },
]

const SEED_REPAIRS = [
  { id:'RP001', equipmentId:'eq-30', equipmentName:'Pump & Needle Kit',  problem:'Air compressor not building pressure.',     status:'In Progress', notes:'Sent to repair shop.',   loggedDate:new Date(Date.now()-8*86400000).toISOString(),  resolvedDate:null },
  { id:'RP002', equipmentId:'eq-9',  equipmentName:'Goal Net — Full Size',problem:'40cm tear on left post bottom seam.',        status:'Pending',     notes:'Awaiting replacement.',  loggedDate:new Date(Date.now()-3*86400000).toISOString(),  resolvedDate:null },
  { id:'RP003', equipmentId:'eq-15', equipmentName:'Rugby Tackle Shield', problem:'Velcro straps broken on 3 shields.',          status:'Pending',     notes:'',                       loggedDate:new Date(Date.now()-2*86400000).toISOString(),  resolvedDate:null },
  { id:'RP004', equipmentId:'eq-8',  equipmentName:'Training Cones',      problem:'12 cones cracked after heavy use.',           status:'Repaired',    notes:'Replaced from spare.',   loggedDate:new Date(Date.now()-12*86400000).toISOString(), resolvedDate:new Date(Date.now()-5*86400000).toISOString() },
]

const SEED_EVENTS = [
  { id:'EV001', name:'U18 League Match — vs Athi FC', date:daysFromNow(2),  type:'Match',      sport:'Football',  venue:'Home', notes:'KO 3pm',           packingList:[] },
  { id:'EV002', name:'U16 Training Session',           date:daysFromNow(1),  type:'Training',   sport:'Football',  venue:'Home', notes:'Tactical drills',  packingList:[] },
  { id:'EV003', name:'Netball League — vs Savanna',   date:daysFromNow(4),  type:'Match',      sport:'Netball',   venue:'Away', notes:'',                  packingList:[] },
  { id:'EV004', name:'Rugby U18 Friendly',            date:daysFromNow(6),  type:'Match',      sport:'Rugby',     venue:'Home', notes:'',                  packingList:[] },
  { id:'EV005', name:'Badminton Inter-School',        date:daysFromNow(10), type:'Tournament', sport:'Badminton', venue:'Away', notes:'',                  packingList:[] },
]

const SEED_ACTIVITY = [
  { id:'act-1', type:'checkout', text:'Shin Guards ×30 issued to James Omondi',      detail:'Team: U18 A', time:new Date(Date.now()-6*86400000).toISOString(), color:'info'  },
  { id:'act-2', type:'checkout', text:'Training Bibs ×3 issued to Peter Kamau',      detail:'Team: U16 A', time:new Date(Date.now()-2*86400000).toISOString(), color:'info'  },
  { id:'act-3', type:'repair',   text:'Goal Net repair ticket logged',               detail:'40cm tear',   time:new Date(Date.now()-3*86400000).toISOString(), color:'warn'  },
  { id:'act-4', type:'checkout', text:'Netball ×4 issued to Grace Wanjiku',          detail:'Netball A',   time:new Date(Date.now()-1*86400000).toISOString(), color:'info'  },
  { id:'act-5', type:'repair',   text:'Training Cones repair resolved',              detail:'Replaced',    time:new Date(Date.now()-5*86400000).toISOString(), color:'ok'    },
]

// ── Context ────────────────────────────────────────────────────
const DataContext = createContext(null)

// Local ID counters for offline mode
let _n = { eq:31, co:5, rp:5, ev:6, br:11, act:6 }
const nextId = (k, prefix) => `${prefix}${String(_n[k]++).padStart(3,'0')}`

export function DataProvider({ children }) {
  const sb = useSupabase()

  // Start with seed data; replace with DB data once loaded
  const [equipment,  setEquipment]  = useState(SEED_EQUIPMENT)
  const [borrowers,  setBorrowers]  = useState(SEED_BORROWERS)
  const [checkouts,  setCheckouts]  = useState(SEED_CHECKOUTS)
  const [repairs,    setRepairs]    = useState(SEED_REPAIRS)
  const [events,     setEvents]     = useState(SEED_EVENTS)
  const [activity,   setActivity]   = useState(SEED_ACTIVITY)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

  // When Supabase loads, replace local state with DB data
  useEffect(() => {
    if (!sb.ready || !sb.online) return
    if (sb.dbEquipment)  setEquipment(sb.dbEquipment)
    if (sb.dbBorrowers)  setBorrowers(sb.dbBorrowers)
    if (sb.dbCheckouts)  setCheckouts(sb.dbCheckouts)
    if (sb.dbRepairs)    setRepairs(sb.dbRepairs)
    if (sb.dbEvents)     setEvents(sb.dbEvents)
    if (sb.dbActivity)   setActivity(sb.dbActivity)
    if (sb.dbCategories) setCategories(sb.dbCategories)
  }, [sb.ready, sb.online])

  // ── Activity helper ──────────────────────────────────────
  const addActivity = useCallback(async (type, text, detail, color = 'info') => {
    const entry = { id: nextId('act','act-'), type, text, detail, color, time: new Date().toISOString() }
    setActivity(prev => [entry, ...prev].slice(0, 50))
    if (sb.online) {
      try { await db.activity.add({ type, text, detail, color }) } catch {}
    }
  }, [sb.online])

  // ── Categories ───────────────────────────────────────────
  const addCategory = useCallback(async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    setCategories(prev => {
      if (prev.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) return prev
      return [...prev, trimmed]
    })
    if (sb.online) {
      try { await db.categories.add(trimmed) } catch {}
    }
    return true
  }, [sb.online])

  // ── Equipment ────────────────────────────────────────────
  const addEquipment = useCallback(async (data) => {
    if (sb.online) {
      try {
        const item = await db.equipment.create(data)
        setEquipment(prev => [...prev, item])
        addActivity('equipment', `${data.name} added to inventory`, `Qty: ${data.total} · ${data.category}`, 'brand')
        return item
      } catch (err) { console.error(err) }
    }
    // Offline fallback
    const item = { ...data, id: nextId('eq','eq-'), available: data.total, status: 'In Store' }
    setEquipment(prev => [...prev, item])
    addActivity('equipment', `${data.name} added to inventory`, `Qty: ${data.total} · ${data.category}`, 'brand')
    return item
  }, [sb.online, addActivity])

  const updateEquipment = useCallback(async (id, data) => {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
    if (sb.online) {
      try { await db.equipment.update(id, data) } catch (err) { console.error(err) }
    }
  }, [sb.online])

  // ── Borrowers ────────────────────────────────────────────
  const addBorrower = useCallback(async (data) => {
    if (sb.online) {
      try {
        const b = await db.borrowers.create(data)
        setBorrowers(prev => [...prev, b])
        return b
      } catch (err) { console.error(err) }
    }
    const b = { ...data, id: nextId('br','B'), joinDate: new Date().toISOString() }
    setBorrowers(prev => [...prev, b])
    return b
  }, [sb.online])

  const updateBorrower = useCallback(async (id, data) => {
    setBorrowers(prev => prev.map(b => b.id === id ? { ...b, ...data } : b))
    if (sb.online) {
      try { await db.borrowers.update(id, data) } catch (err) { console.error(err) }
    }
  }, [sb.online])

  // ── Issue Equipment ──────────────────────────────────────
  const issueEquipment = useCallback(async (data) => {
    const eq = equipment.find(e => e.id === data.equipmentId)
    const newAvail = eq.available - data.qty
    const newStatus = newAvail === 0 ? 'Checked Out' : eq.status

    // Optimistic update
    setEquipment(prev => prev.map(e =>
      e.id === data.equipmentId ? { ...e, available: newAvail, status: newStatus } : e
    ))

    const co = {
      ...data,
      id: nextId('co','CO'),
      status: 'Active',
      returnLines: [],
    }
    setCheckouts(prev => [...prev, co])
    addActivity('checkout', `${eq.name} ×${data.qty} issued to ${data.borrowerName}`, `Team: ${data.team} · Coach: ${data.coach}`, 'info')

    if (sb.online) {
      try {
        // Use the atomic RPC for safe concurrent checkouts
        const { data: rpcData, error } = await import('../lib/supabase.js').then(m =>
          m.supabase.rpc('issue_equipment', {
            p_equipment_id:   data.equipmentId,
            p_equipment_name: data.equipmentName,
            p_borrower_id:    data.borrowerId,
            p_borrower_name:  data.borrowerName,
            p_id_number:      data.idNumber,
            p_phone:          data.phone,
            p_qty:            data.qty,
            p_issued_at:      data.issuedAt,
            p_issued_date:    data.issuedDate,
            p_due_date:       data.dueDate,
            p_coach:          data.coach || null,
            p_team:           data.team  || null,
            p_notes:          data.notes || null,
          })
        )
        if (error) throw error
        // Update local checkout with real DB id
        setCheckouts(prev => prev.map(c =>
          c.id === co.id ? { ...c, id: rpcData } : c
        ))
      } catch (err) {
        console.error('[KitFlow] issueEquipment DB error:', err.message)
      }
    }
    return co
  }, [equipment, sb.online, addActivity])

  // ── Return Equipment (split lines) ───────────────────────
  const returnEquipment = useCallback(async (checkoutId, returnLines) => {
    const co = checkouts.find(c => c.id === checkoutId)
    if (!co) return

    const totalReturned = returnLines.reduce((s, l) => s + l.qty, 0)
    const allReturned   = totalReturned >= co.qty
    const newStatus     = allReturned ? 'Returned' : 'Partial'

    // Optimistic: update checkout
    setCheckouts(prev => prev.map(c =>
      c.id === checkoutId
        ? { ...c, returnLines, returnedDate: new Date().toISOString(), status: newStatus }
        : c
    ))

    let goodQty  = 0
    let lostQty  = 0
    const damaged = []

    returnLines.forEach(line => {
      if (line.condition === 'Good')    goodQty += line.qty
      else if (line.condition === 'Lost') lostQty += line.qty
      else if (line.condition === 'Damaged') damaged.push(line)
    })

    // Optimistic: update equipment
    const eq = equipment.find(e => e.id === co.equipmentId)
    if (eq) {
      const newAvail = eq.available + goodQty
      const newTotal = eq.total - lostQty
      setEquipment(prev => prev.map(e =>
        e.id === co.equipmentId
          ? { ...e, available: newAvail, total: newTotal, status: newAvail > 0 ? 'In Store' : e.status }
          : e
      ))
    }

    // Optimistic: create repair tickets for damaged items
    damaged.forEach(line => {
      const rp = {
        id:            nextId('rp','RP'),
        equipmentId:   co.equipmentId,
        equipmentName: co.equipmentName,
        problem:       line.notes || 'Returned damaged',
        status:        'Pending',
        notes:         `Auto-created from checkout ${checkoutId}`,
        loggedDate:    new Date().toISOString(),
        resolvedDate:  null,
      }
      setRepairs(prev => [rp, ...prev])
    })

    const summary = returnLines.map(l => `${l.qty} × ${l.condition}`).join(', ')
    addActivity('checkin', `${co.equipmentName} returned by ${co.borrowerName}`, summary, goodQty > 0 ? 'ok' : 'warn')

    // DB write
    if (sb.online) {
      try {
        const { supabase } = await import('../lib/supabase.js')
        const { error } = await supabase.rpc('process_return', {
          p_checkout_id: checkoutId,
          p_lines: returnLines.map(l => ({
            qty:          l.qty,
            condition:    l.condition,
            notes:        l.notes || null,
            returned_at:  l.returnedAt,
          })),
        })
        if (error) throw error
      } catch (err) {
        console.error('[KitFlow] returnEquipment DB error:', err.message)
      }
    }
  }, [checkouts, equipment, sb.online, addActivity])

  // ── Repairs ──────────────────────────────────────────────
  const addRepair = useCallback(async (data) => {
    const rp = {
      ...data,
      id:          nextId('rp','RP'),
      loggedDate:  new Date().toISOString(),
      resolvedDate: null,
    }
    setRepairs(prev => [rp, ...prev])
    setEquipment(prev => prev.map(e => e.id === data.equipmentId ? { ...e, status: 'Under Repair' } : e))
    addActivity('repair', `Repair logged for ${data.equipmentName}`, data.problem, 'warn')

    if (sb.online) {
      try { await db.repairs.create(data) } catch (err) { console.error(err) }
    }
    return rp
  }, [sb.online, addActivity])

  const updateRepair = useCallback(async (id, data) => {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    if (data.status === 'Completed') {
      const rp = repairs.find(r => r.id === id)
      if (rp) {
        setEquipment(prev => prev.map(e => {
          if (e.id !== rp.equipmentId) return e
          return { ...e, available: e.available + 1, status: 'In Store' }
        }))
        addActivity('repair', `${rp.equipmentName} repair completed`, 'Restored to stock', 'ok')
      }
    }
    if (sb.online) {
      try { await db.repairs.update(id, data) } catch (err) { console.error(err) }
    }
  }, [repairs, sb.online, addActivity])

  // ── Events ───────────────────────────────────────────────
  const addEvent = useCallback(async (data) => {
    const ev = { ...data, id: nextId('ev','EV'), packingList: [] }
    setEvents(prev => [...prev, ev])
    if (sb.online) {
      try {
        const created = await db.events.create(data)
        setEvents(prev => prev.map(e => e.id === ev.id ? { ...created, packingList: [] } : e))
        return created
      } catch (err) { console.error(err) }
    }
    return ev
  }, [sb.online])

  const updateEvent = useCallback(async (id, data) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
    if (sb.online) {
      try { await db.events.update(id, data) } catch (err) { console.error(err) }
    }
  }, [sb.online])

  const deleteEvent = useCallback(async (id) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    if (sb.online) {
      try { await db.events.delete(id) } catch (err) { console.error(err) }
    }
  }, [sb.online])

  const addPackingItem = useCallback(async (eventId, item) => {
    const localItem = { ...item, id: Date.now(), packed: false }
    setEvents(prev => prev.map(ev =>
      ev.id === eventId
        ? { ...ev, packingList: [...ev.packingList, localItem] }
        : ev
    ))
    if (sb.online) {
      try {
        const created = await db.packing.add(eventId, item)
        setEvents(prev => prev.map(ev =>
          ev.id === eventId
            ? { ...ev, packingList: ev.packingList.map(i => i.id === localItem.id ? created : i) }
            : ev
        ))
      } catch (err) { console.error(err) }
    }
  }, [sb.online])

  const removePackingItem = useCallback(async (eventId, itemId) => {
    setEvents(prev => prev.map(ev =>
      ev.id === eventId
        ? { ...ev, packingList: ev.packingList.filter(i => i.id !== itemId) }
        : ev
    ))
    if (sb.online) {
      try { await db.packing.remove(itemId) } catch (err) { console.error(err) }
    }
  }, [sb.online])

  const togglePackingItemPacked = useCallback(async (eventId, itemId) => {
    let newPacked = false
    setEvents(prev => prev.map(ev => {
      if (ev.id !== eventId) return ev
      return {
        ...ev,
        packingList: ev.packingList.map(i => {
          if (i.id !== itemId) return i
          newPacked = !i.packed
          return { ...i, packed: !i.packed }
        }),
      }
    }))
    if (sb.online) {
      try { await db.packing.togglePacked(itemId, newPacked) } catch (err) { console.error(err) }
    }
  }, [sb.online])

  return (
    <DataContext.Provider value={{
      // State
      equipment, borrowers, checkouts, repairs, events, activity, categories,
      // Meta
      dbOnline: sb.online, dbReady: sb.ready, dbError: sb.error,
      // Actions
      addEquipment, updateEquipment,
      addBorrower,  updateBorrower,
      issueEquipment, returnEquipment,
      addRepair, updateRepair,
      addEvent, updateEvent, deleteEvent,
      addPackingItem, removePackingItem, togglePackingItemPacked,
      addCategory,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
