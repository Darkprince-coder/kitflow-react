import { createContext, useContext, useState, useCallback } from 'react'
import { addDays } from 'date-fns'
import { DEFAULT_CATEGORIES } from '../utils/constants.js'

// ── helpers ──────────────────────────────────────────────────
const today       = () => new Date().toISOString()
const daysFromNow = (n) => { const d = addDays(new Date(), n); return d.toISOString().split('T')[0] }

// ── Seed Equipment — covers all academy sports ────────────────
const SEED_EQUIPMENT = [
  // Football
  { id:1,  name:'Match Football (Size 5)',       category:'Football',  total:20, available:14, condition:'Good', status:'In Store',    minStock:5, notes:'' },
  { id:2,  name:'Training Football (Size 4)',    category:'Football',  total:15, available:10, condition:'Fair', status:'In Store',    minStock:4, notes:'Some surface wear' },
  { id:3,  name:'Training Football (Size 3)',    category:'Football',  total:10, available:8,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:4,  name:'Goalkeeper Gloves (Pair)',      category:'Football',  total:12, available:9,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:5,  name:'Goalkeeper Jersey (Set of 3)',  category:'Football',  total:6,  available:4,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:6,  name:'Shin Guards (Pair)',            category:'Football',  total:30, available:0,  condition:'Good', status:'Checked Out', minStock:8, notes:'' },
  { id:7,  name:'Training Bibs (Set of 20)',     category:'Football',  total:8,  available:5,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:8,  name:'Training Cones (Set of 50)',    category:'Football',  total:10, available:7,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:9,  name:'Goal Net — Full Size (Pair)',   category:'Football',  total:4,  available:3,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
  { id:10, name:'Pop-Up Goals (Set of 4)',       category:'Football',  total:6,  available:4,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  // Rugby
  { id:11, name:'Rugby Ball (Size 5)',           category:'Rugby',     total:12, available:9,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:12, name:'Rugby Ball (Size 4)',           category:'Rugby',     total:8,  available:6,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:13, name:'Rugby Tackle Pads',             category:'Rugby',     total:10, available:7,  condition:'Fair', status:'In Store',    minStock:3, notes:'' },
  { id:14, name:'Rugby Scrum Cap',               category:'Rugby',     total:20, available:15, condition:'Good', status:'In Store',    minStock:5, notes:'' },
  { id:15, name:'Rugby Mouthguard',              category:'Rugby',     total:30, available:22, condition:'New',  status:'In Store',    minStock:8, notes:'' },
  { id:16, name:'Rugby Tackle Shield',           category:'Rugby',     total:8,  available:0,  condition:'Poor', status:'Under Repair',minStock:2, notes:'Straps broken' },
  // Netball
  { id:17, name:'Netball (Size 5)',              category:'Netball',   total:15, available:11, condition:'Good', status:'In Store',    minStock:4, notes:'' },
  { id:18, name:'Netball Bibs (Set of 14)',      category:'Netball',   total:6,  available:4,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:19, name:'Netball Post Pads (Pair)',      category:'Netball',   total:4,  available:3,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
  // Volleyball
  { id:20, name:'Volleyball (Indoor)',           category:'Volleyball',total:10, available:7,  condition:'Good', status:'In Store',    minStock:3, notes:'' },
  { id:21, name:'Volleyball (Beach/Outdoor)',    category:'Volleyball',total:6,  available:5,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:22, name:'Volleyball Net (Full Size)',    category:'Volleyball',total:3,  available:2,  condition:'Fair', status:'In Store',    minStock:1, notes:'' },
  { id:23, name:'Volleyball Knee Pads (Pair)',   category:'Volleyball',total:20, available:14, condition:'Good', status:'In Store',    minStock:5, notes:'' },
  // Badminton
  { id:24, name:'Badminton Racket',              category:'Badminton', total:24, available:18, condition:'Good', status:'In Store',    minStock:6, notes:'' },
  { id:25, name:'Badminton Shuttlecocks (Tube)', category:'Badminton', total:20, available:13, condition:'Good', status:'In Store',    minStock:5, notes:'' },
  { id:26, name:'Badminton Net',                 category:'Badminton', total:4,  available:3,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
  // Tennis
  { id:27, name:'Tennis Racket',                 category:'Tennis',    total:16, available:12, condition:'Good', status:'In Store',    minStock:4, notes:'' },
  { id:28, name:'Tennis Balls (Can of 3)',       category:'Tennis',    total:18, available:11, condition:'Good', status:'In Store',    minStock:4, notes:'' },
  { id:29, name:'Tennis Net',                    category:'Tennis',    total:2,  available:2,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
  // Medical / General
  { id:30, name:'First Aid Kit',                 category:'Medical',   total:4,  available:3,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:31, name:'Ice Packs (Box of 20)',         category:'Medical',   total:6,  available:4,  condition:'Good', status:'In Store',    minStock:2, notes:'' },
  { id:32, name:'Coaching Whiteboard',           category:'General',   total:3,  available:2,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
  { id:33, name:'Pump & Needle Kit',             category:'General',   total:3,  available:0,  condition:'Poor', status:'Under Repair',minStock:1, notes:'Compressor faulty' },
  { id:34, name:'Scoreboard (Portable)',         category:'General',   total:2,  available:2,  condition:'Good', status:'In Store',    minStock:1, notes:'' },
]

const SEED_BORROWERS = [
  { id:'B001', name:'James Omondi',   idNumber:'KE-34521890', phone:'+254712345678', emergency:'+254700111222', role:'Player', team:'U18 A',      joinDate:'2023-08-01', notes:'' },
  { id:'B002', name:'Brian Ndegwa',   idNumber:'KE-28765432', phone:'+254723456789', emergency:'+254700222333', role:'Player', team:'U18 A',      joinDate:'2023-08-01', notes:'' },
  { id:'B003', name:'Kevin Lekuton',  idNumber:'KE-19843201', phone:'+254734567890', emergency:'+254700333444', role:'Player', team:'U16 B',      joinDate:'2024-01-15', notes:'' },
  { id:'B004', name:'Grace Wanjiku',  idNumber:'KE-45612387', phone:'+254745678901', emergency:'+254700444555', role:'Player', team:'Netball A',  joinDate:'2024-01-15', notes:'' },
  { id:'B005', name:'Peter Kamau',    idNumber:'KE-31290087', phone:'+254756789012', emergency:'+254700555666', role:'Staff',  team:'All',        joinDate:'2022-06-01', notes:'Head Coach' },
  { id:'B006', name:'Diana Achieng',  idNumber:'KE-52109834', phone:'+254767890123', emergency:'+254700666777', role:'Coach',  team:'All',        joinDate:'2022-06-01', notes:'Assistant Coach' },
  { id:'B007', name:'Samuel Oduya',   idNumber:'KE-40987612', phone:'+254778901234', emergency:'+254700777888', role:'Player', team:'U14 A',      joinDate:'2024-09-01', notes:'' },
  { id:'B008', name:'Collins Otieno', idNumber:'KE-37654920', phone:'+254789012345', emergency:'+254700888999', role:'Player', team:'Rugby U18',   joinDate:'2024-09-01', notes:'' },
  { id:'B009', name:'Aisha Mwangi',   idNumber:'KE-60123456', phone:'+254790123456', emergency:'+254700999000', role:'Player', team:'Volleyball A',joinDate:'2025-01-10', notes:'' },
  { id:'B010', name:'Tom Rotich',     idNumber:'KE-55678901', phone:'+254701234567', emergency:'+254700001111', role:'Player', team:'Badminton',   joinDate:'2025-03-01', notes:'' },
]

const SEED_CHECKOUTS = [
  {
    id:'CO001', equipmentId:6,  equipmentName:'Shin Guards (Pair)',
    borrowerId:'B001', borrowerName:'James Omondi', idNumber:'KE-34521890', phone:'+254712345678',
    qty:30, issuedAt: new Date(Date.now()-6*86400000).toISOString(),
    issuedDate: daysFromNow(-6), dueDate: daysFromNow(-1),
    returnedDate:null, coach:'Peter Kamau', team:'U18 A',
    notes:'Full squad pre-season training', status:'Active', returnLines:[],
  },
  {
    id:'CO002', equipmentId:7, equipmentName:'Training Bibs (Set of 20)',
    borrowerId:'B005', borrowerName:'Peter Kamau', idNumber:'KE-31290087', phone:'+254756789012',
    qty:3, issuedAt: new Date(Date.now()-2*86400000).toISOString(),
    issuedDate: daysFromNow(-2), dueDate: daysFromNow(3),
    returnedDate:null, coach:'Peter Kamau', team:'U16 A',
    notes:'Match day session', status:'Active', returnLines:[],
  },
  {
    id:'CO003', equipmentId:17, equipmentName:'Netball (Size 5)',
    borrowerId:'B004', borrowerName:'Grace Wanjiku', idNumber:'KE-45612387', phone:'+254745678901',
    qty:4, issuedAt: new Date(Date.now()-1*86400000).toISOString(),
    issuedDate: daysFromNow(-1), dueDate: daysFromNow(5),
    returnedDate:null, coach:'Diana Achieng', team:'Netball A',
    notes:'League practice', status:'Active', returnLines:[],
  },
  {
    id:'CO004', equipmentId:24, equipmentName:'Badminton Racket',
    borrowerId:'B010', borrowerName:'Tom Rotich', idNumber:'KE-55678901', phone:'+254701234567',
    qty:6, issuedAt: new Date(Date.now()-3*86400000).toISOString(),
    issuedDate: daysFromNow(-3), dueDate: daysFromNow(4),
    returnedDate:null, coach:'Peter Kamau', team:'Badminton',
    notes:'Inter-school tournament prep', status:'Active', returnLines:[],
  },
]

const SEED_REPAIRS = [
  { id:'RP001', equipmentId:33, equipmentName:'Pump & Needle Kit',      problem:'Air compressor not building pressure. Motor runs but no output.', status:'In Progress', notes:'Sent to repair shop.',       loggedDate: daysFromNow(-8),  resolvedDate:null },
  { id:'RP002', equipmentId:9,  equipmentName:'Goal Net — Full Size',   problem:'Left post net has a 40cm tear along the bottom seam.',            status:'Pending',     notes:'Awaiting replacement net.', loggedDate: daysFromNow(-3),  resolvedDate:null },
  { id:'RP003', equipmentId:16, equipmentName:'Rugby Tackle Shield',    problem:'Velcro straps broken on 3 shields, padding exposed.',             status:'Pending',     notes:'',                          loggedDate: daysFromNow(-2),  resolvedDate:null },
  { id:'RP004', equipmentId:8,  equipmentName:'Training Cones (Set)',   problem:'12 cones cracked after heavy use.',                               status:'Repaired',    notes:'Replaced from spare stock.', loggedDate: daysFromNow(-12), resolvedDate: daysFromNow(-5) },
]

const SEED_EVENTS = [
  { id:'EV001', name:'U18 League Match — vs Athi FC',  date: daysFromNow(2),  type:'Match',      sport:'Football',  venue:'Home', notes:'KO 3pm',           packingList:[] },
  { id:'EV002', name:'U16 Training Session',            date: daysFromNow(1),  type:'Training',   sport:'Football',  venue:'Home', notes:'Tactical drills',  packingList:[] },
  { id:'EV003', name:'Pre-Season Tournament',           date: daysFromNow(9),  type:'Tournament', sport:'Football',  venue:'Away', notes:'Full squad',        packingList:[] },
  { id:'EV004', name:'Netball League — vs Savanna',    date: daysFromNow(4),  type:'Match',      sport:'Netball',   venue:'Away', notes:'',                  packingList:[] },
  { id:'EV005', name:'Rugby U18 Friendly',             date: daysFromNow(6),  type:'Match',      sport:'Rugby',     venue:'Home', notes:'',                  packingList:[] },
  { id:'EV006', name:'Badminton Inter-School',         date: daysFromNow(10), type:'Tournament', sport:'Badminton', venue:'Away', notes:'',                  packingList:[] },
  { id:'EV007', name:'Academy Open Day',               date: daysFromNow(14), type:'Other',      sport:'General',   venue:'Home', notes:'Parents invited',   packingList:[] },
]

const SEED_ACTIVITY = [
  { id:1, type:'checkout', text:'Shin Guards ×30 issued to James Omondi',      detail:'Team: U18 A · Coach: Peter Kamau', time: daysFromNow(-6), color:'info'  },
  { id:2, type:'checkout', text:'Training Bibs ×3 issued to Peter Kamau',      detail:'Team: U16 A',                      time: daysFromNow(-2), color:'info'  },
  { id:3, type:'checkout', text:'Netball ×4 issued to Grace Wanjiku',          detail:'Team: Netball A',                  time: daysFromNow(-1), color:'info'  },
  { id:4, type:'repair',   text:'Goal Net repair ticket logged',               detail:'40cm tear — left post',            time: daysFromNow(-3), color:'warn'  },
  { id:5, type:'repair',   text:'Rugby Tackle Shield repair ticket logged',    detail:'Velcro straps broken',             time: daysFromNow(-2), color:'warn'  },
  { id:6, type:'checkin',  text:'Training Cones returned — repair resolved',   detail:'Replaced cracked cones',           time: daysFromNow(-5), color:'ok'    },
]

// ── Context ───────────────────────────────────────────────────
const DataContext = createContext(null)

let _nextId = { eq:35, co:5, rp:5, ev:8, br:11, act:7 }
const nextId = (k) => { const id = _nextId[k]; _nextId[k]++; return id }

export function DataProvider({ children }) {
  const [equipment,  setEquipment]  = useState(SEED_EQUIPMENT)
  const [borrowers,  setBorrowers]  = useState(SEED_BORROWERS)
  const [checkouts,  setCheckouts]  = useState(SEED_CHECKOUTS)
  const [repairs,    setRepairs]    = useState(SEED_REPAIRS)
  const [events,     setEvents]     = useState(SEED_EVENTS)
  const [activity,   setActivity]   = useState(SEED_ACTIVITY)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

  const addActivity = useCallback((type, text, detail, color = 'info') => {
    const entry = { id:nextId('act'), type, text, detail, time:new Date().toISOString(), color }
    setActivity(prev => [entry, ...prev].slice(0, 50))
  }, [])

  // ── Categories (user-managed) ─────────────────────────────
  const addCategory = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return false
    setCategories(prev => {
      if (prev.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) return prev
      return [...prev, trimmed]
    })
    return true
  }, [])

  // ── Equipment ─────────────────────────────────────────────
  const addEquipment = useCallback((data) => {
    const item = { ...data, id:nextId('eq'), available:data.total, status:'In Store' }
    setEquipment(prev => [...prev, item])
    addActivity('equipment', `${data.name} added to inventory`, `Qty: ${data.total} · ${data.category}`, 'brand')
    return item
  }, [addActivity])

  const updateEquipment = useCallback((id, data) => {
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  }, [])

  // ── Borrowers ─────────────────────────────────────────────
  const addBorrower = useCallback((data) => {
    const b = { ...data, id:`B${String(nextId('br')).padStart(3,'0')}`, joinDate:new Date().toISOString() }
    setBorrowers(prev => [...prev, b])
    return b
  }, [])

  const updateBorrower = useCallback((id, data) => {
    setBorrowers(prev => prev.map(b => b.id === id ? { ...b, ...data } : b))
  }, [])

  // ── Checkout ──────────────────────────────────────────────
  const issueEquipment = useCallback((data) => {
    const id = `CO${String(nextId('co')).padStart(3,'0')}`
    const eq = equipment.find(e => e.id === data.equipmentId)
    const checkout = { ...data, id, status:'Active', returnLines:[] }
    setCheckouts(prev => [...prev, checkout])
    setEquipment(prev => prev.map(e => {
      if (e.id !== data.equipmentId) return e
      const newAvail = e.available - data.qty
      return { ...e, available:newAvail, status: newAvail === 0 ? 'Checked Out' : e.status }
    }))
    addActivity('checkout', `${eq?.name} ×${data.qty} issued to ${data.borrowerName}`, `Team: ${data.team} · Coach: ${data.coach}`, 'info')
    return checkout
  }, [equipment, addActivity])

  // ── Check-In (split returns) ──────────────────────────────
  const returnEquipment = useCallback((checkoutId, returnLines) => {
    const co = checkouts.find(c => c.id === checkoutId)
    if (!co) return

    const totalReturned = returnLines.reduce((s, l) => s + l.qty, 0)
    const allReturned   = totalReturned >= co.qty

    setCheckouts(prev => prev.map(c =>
      c.id === checkoutId
        ? { ...c, returnLines, returnedDate:new Date().toISOString(), status: allReturned ? 'Returned' : 'Partial' }
        : c
    ))

    let goodQty = 0
    returnLines.forEach(line => {
      if (line.condition === 'Good') {
        goodQty += line.qty
      } else if (line.condition === 'Damaged') {
        const rpId = `RP${String(nextId('rp')).padStart(3,'0')}`
        setRepairs(prev => [...prev, {
          id: rpId,
          equipmentId:   co.equipmentId,
          equipmentName: co.equipmentName,
          problem:       line.notes || 'Returned damaged — no description provided',
          status:        'Pending',
          notes:         `Auto-created on return of checkout ${checkoutId}`,
          loggedDate:    new Date().toISOString(),
          resolvedDate:  null,
        }])
      } else if (line.condition === 'Lost') {
        setEquipment(prev => prev.map(e =>
          e.id === co.equipmentId
            ? { ...e, total: Math.max(0, e.total - line.qty) }
            : e
        ))
      }
    })

    if (goodQty > 0) {
      setEquipment(prev => prev.map(e => {
        if (e.id !== co.equipmentId) return e
        const newAvail = e.available + goodQty
        return { ...e, available: newAvail, status: newAvail > 0 ? 'In Store' : e.status }
      }))
    }

    const summary = returnLines.map(l => `${l.qty} × ${l.condition}`).join(', ')
    addActivity('checkin', `${co.equipmentName} returned by ${co.borrowerName}`, summary, goodQty > 0 ? 'ok' : 'warn')
  }, [checkouts, addActivity])

  // ── Repairs ───────────────────────────────────────────────
  const addRepair = useCallback((data) => {
    const id = `RP${String(nextId('rp')).padStart(3,'0')}`
    const repair = { ...data, id, loggedDate:new Date().toISOString(), resolvedDate:null }
    setRepairs(prev => [...prev, repair])
    setEquipment(prev => prev.map(e => e.id === data.equipmentId ? { ...e, status:'Under Repair' } : e))
    addActivity('repair', `Repair logged for ${data.equipmentName}`, data.problem, 'warn')
    return repair
  }, [addActivity])

  const updateRepair = useCallback((id, data) => {
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    if (data.status === 'Repaired') {
      const repair = repairs.find(r => r.id === id)
      if (repair) {
        setEquipment(prev => prev.map(e => {
          if (e.id !== repair.equipmentId) return e
          const newAvail = e.available + 1
          return { ...e, available: newAvail, status:'In Store' }
        }))
        addActivity('repair', `${repair.equipmentName} repair completed`, 'Restored to stock', 'ok')
      }
    }
  }, [repairs, addActivity])

  // ── Calendar ──────────────────────────────────────────────
  const addEvent = useCallback((data) => {
    const id = `EV${String(nextId('ev')).padStart(3,'0')}`
    const event = { ...data, id, packingList:[] }
    setEvents(prev => [...prev, event])
    return event
  }, [])

  const updateEvent = useCallback((id, data) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  }, [])

  const deleteEvent = useCallback((id) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  const addPackingItem = useCallback((eventId, item) => {
    setEvents(prev => prev.map(ev =>
      ev.id === eventId
        ? { ...ev, packingList:[...ev.packingList, { ...item, id:Date.now(), packed:false }] }
        : ev
    ))
  }, [])

  const removePackingItem = useCallback((eventId, itemId) => {
    setEvents(prev => prev.map(ev =>
      ev.id === eventId
        ? { ...ev, packingList: ev.packingList.filter(i => i.id !== itemId) }
        : ev
    ))
  }, [])

  const togglePackingItemPacked = useCallback((eventId, itemId) => {
    setEvents(prev => prev.map(ev =>
      ev.id === eventId
        ? { ...ev, packingList: ev.packingList.map(i => i.id === itemId ? { ...i, packed:!i.packed } : i) }
        : ev
    ))
  }, [])

  return (
    <DataContext.Provider value={{
      equipment, borrowers, checkouts, repairs, events, activity, categories,
      addEquipment, updateEquipment,
      addBorrower, updateBorrower,
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
