// ============================================================
//  KitFlow — Supabase Data Service
//  All database reads and writes go through this file.
//  The rest of the app never imports supabase directly.
//
//  Column naming convention:
//    DB uses snake_case  (equipment_id, issued_at, …)
//    App uses camelCase  (equipmentId, issuedAt, …)
//  The toApp* and toDb* helpers below handle the mapping.
// ============================================================

import { supabase } from './supabase.js'

// ── Generic error handler ─────────────────────────────────
const check = ({ data, error }, label) => {
  if (error) {
    console.error(`[KitFlow DB] ${label}:`, error.message)
    throw new Error(error.message)
  }
  return data
}

// ── Row mappers ───────────────────────────────────────────

const toAppEquipment = (row) => ({
  id:        row.id,
  name:      row.name,
  category:  row.category,
  total:     row.total,
  available: row.available,
  minStock:  row.min_stock,
  condition: row.condition,
  status:    row.status,
  notes:     row.notes || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toAppBorrower = (row) => ({
  id:        row.id,
  name:      row.name,
  idNumber:  row.id_number,
  phone:     row.phone,
  emergency: row.emergency || '',
  role:      row.role,
  team:      row.team || '',
  notes:     row.notes || '',
  joinDate:  row.join_date,
})

const toAppCheckout = (row) => ({
  id:            row.id,
  equipmentId:   row.equipment_id,
  equipmentName: row.equipment_name,
  borrowerId:    row.borrower_id,
  borrowerName:  row.borrower_name,
  idNumber:      row.id_number,
  phone:         row.phone,
  qty:           row.qty,
  issuedAt:      row.issued_at,
  issuedDate:    row.issued_date,
  dueDate:       row.due_date,
  returnedDate:  row.returned_date,
  coach:         row.coach || '',
  team:          row.team  || '',
  notes:         row.notes || '',
  status:        row.status,
  returnLines:   [],       // loaded separately when needed
})

const toAppReturnLine = (row) => ({
  id:          row.id,
  checkoutId:  row.checkout_id,
  qty:         row.qty,
  condition:   row.condition,
  notes:       row.notes || '',
  returnedAt:  row.returned_at,
})

const toAppRepair = (row) => ({
  id:            row.id,
  equipmentId:   row.equipment_id,
  equipmentName: row.equipment_name,
  problem:       row.problem,
  status:        row.status,
  notes:         row.notes || '',
  loggedDate:    row.logged_at,
  resolvedDate:  row.resolved_at || null,
})

const toAppEvent = (row, packingList = []) => ({
  id:          row.id,
  name:        row.name,
  date:        row.date,
  type:        row.type,
  sport:       row.sport,
  venue:       row.venue,
  notes:       row.notes || '',
  packingList,
})

const toAppPackingItem = (row) => ({
  id:            row.id,
  eventId:       row.event_id,
  equipmentId:   row.equipment_id,
  equipmentName: row.equipment_name,
  category:      row.category || '',
  qty:           row.qty,
  notes:         row.notes || '',
  packed:        row.packed,
})

const toAppActivity = (row) => ({
  id:     row.id,
  type:   row.type,
  text:   row.text,
  detail: row.detail || '',
  color:  row.color  || 'info',
  time:   row.created_at,
})

// ============================================================
//  CATEGORIES
// ============================================================
export const db = {

  categories: {
    async list() {
      const rows = check(
        await supabase.from('categories').select('name').order('name'),
        'categories.list'
      )
      return rows.map(r => r.name)
    },

    async add(name) {
      check(
        await supabase.from('categories').insert({ name }),
        'categories.add'
      )
      return name
    },
  },

  // ============================================================
  //  EQUIPMENT
  // ============================================================
  equipment: {
    async list() {
      const rows = check(
        await supabase.from('equipment').select('*').order('name'),
        'equipment.list'
      )
      return rows.map(toAppEquipment)
    },

    async create(data) {
      const rows = check(
        await supabase.from('equipment').insert({
          name:      data.name,
          category:  data.category,
          total:     data.total,
          available: data.total,
          min_stock: data.minStock,
          condition: data.condition,
          status:    'In Store',
          notes:     data.notes || null,
        }).select(),
        'equipment.create'
      )
      return toAppEquipment(rows[0])
    },

    async update(id, data) {
      const payload = {}
      if (data.name      !== undefined) payload.name      = data.name
      if (data.category  !== undefined) payload.category  = data.category
      if (data.total     !== undefined) payload.total     = data.total
      if (data.available !== undefined) payload.available = data.available
      if (data.minStock  !== undefined) payload.min_stock = data.minStock
      if (data.condition !== undefined) payload.condition = data.condition
      if (data.status    !== undefined) payload.status    = data.status
      if (data.notes     !== undefined) payload.notes     = data.notes

      const rows = check(
        await supabase.from('equipment').update(payload).eq('id', id).select(),
        'equipment.update'
      )
      return toAppEquipment(rows[0])
    },

    // Adjust available count atomically using Postgres RPC
    // (avoids race conditions on concurrent checkouts)
    async adjustAvailable(id, delta) {
      check(
        await supabase.rpc('adjust_equipment_available', { eq_id: id, delta }),
        'equipment.adjustAvailable'
      )
    },
  },

  // ============================================================
  //  BORROWERS
  // ============================================================
  borrowers: {
    async list() {
      const rows = check(
        await supabase.from('borrowers').select('*').order('name'),
        'borrowers.list'
      )
      return rows.map(toAppBorrower)
    },

    async create(data) {
      const rows = check(
        await supabase.from('borrowers').insert({
          name:      data.name,
          id_number: data.idNumber,
          phone:     data.phone,
          emergency: data.emergency || null,
          role:      data.role,
          team:      data.team      || null,
          notes:     data.notes     || null,
        }).select(),
        'borrowers.create'
      )
      return toAppBorrower(rows[0])
    },

    async update(id, data) {
      const payload = {}
      if (data.name      !== undefined) payload.name      = data.name
      if (data.idNumber  !== undefined) payload.id_number = data.idNumber
      if (data.phone     !== undefined) payload.phone     = data.phone
      if (data.emergency !== undefined) payload.emergency = data.emergency
      if (data.role      !== undefined) payload.role      = data.role
      if (data.team      !== undefined) payload.team      = data.team
      if (data.notes     !== undefined) payload.notes     = data.notes

      const rows = check(
        await supabase.from('borrowers').update(payload).eq('id', id).select(),
        'borrowers.update'
      )
      return toAppBorrower(rows[0])
    },
  },

  // ============================================================
  //  CHECKOUTS
  // ============================================================
  checkouts: {
    async list() {
      const rows = check(
        await supabase.from('checkouts').select('*').order('issued_at', { ascending: false }),
        'checkouts.list'
      )
      const checkoutList = rows.map(toAppCheckout)

      // Load all return lines and attach to their checkouts
      const lines = check(
        await supabase.from('return_lines').select('*').order('returned_at'),
        'checkouts.listReturnLines'
      )
      const linesByCheckout = {}
      lines.forEach(l => {
        if (!linesByCheckout[l.checkout_id]) linesByCheckout[l.checkout_id] = []
        linesByCheckout[l.checkout_id].push(toAppReturnLine(l))
      })
      checkoutList.forEach(co => {
        co.returnLines = linesByCheckout[co.id] || []
      })

      return checkoutList
    },

    async create(data) {
      // 1. Insert checkout row
      const rows = check(
        await supabase.from('checkouts').insert({
          equipment_id:   data.equipmentId,
          equipment_name: data.equipmentName,
          borrower_id:    data.borrowerId,
          borrower_name:  data.borrowerName,
          id_number:      data.idNumber,
          phone:          data.phone,
          qty:            data.qty,
          issued_at:      data.issuedAt,
          issued_date:    data.issuedDate,
          due_date:       data.dueDate,
          coach:          data.coach || null,
          team:           data.team  || null,
          notes:          data.notes || null,
          status:         'Active',
        }).select(),
        'checkouts.create'
      )

      // 2. Decrement available on equipment
      check(
        await supabase
          .from('equipment')
          .update({ available: data.equipmentAvailableAfter, status: data.equipmentStatusAfter })
          .eq('id', data.equipmentId),
        'checkouts.create.updateEquipment'
      )

      return toAppCheckout(rows[0])
    },

    // Process a return with split lines
    async processReturn(checkoutId, lines, equipmentId, goodQty, damagedItems, lostQty, currentAvailable, currentTotal) {
      // 1. Insert return_lines rows
      const lineInserts = lines.map(l => ({
        checkout_id: checkoutId,
        qty:         l.qty,
        condition:   l.condition,
        notes:       l.notes || null,
        returned_at: l.returnedAt,
      }))
      check(
        await supabase.from('return_lines').insert(lineInserts),
        'checkouts.processReturn.insertLines'
      )

      // 2. Determine new checkout status
      const totalReturned = lines.reduce((s, l) => s + l.qty, 0)
      const checkout = check(
        await supabase.from('checkouts').select('qty').eq('id', checkoutId).single(),
        'checkouts.processReturn.getCheckout'
      )
      const allBack  = totalReturned >= checkout.qty
      const newStatus = allBack ? 'Returned' : 'Partial'

      check(
        await supabase.from('checkouts').update({
          status:        newStatus,
          returned_date: new Date().toISOString(),
        }).eq('id', checkoutId),
        'checkouts.processReturn.updateStatus'
      )

      // 3. Update equipment available
      const newAvail  = currentAvailable + goodQty
      const newTotal  = currentTotal - lostQty
      const newStatus2 = newAvail > 0 ? 'In Store' : 'Checked Out'
      check(
        await supabase.from('equipment').update({
          available: newAvail,
          total:     newTotal,
          status:    newStatus2,
        }).eq('id', equipmentId),
        'checkouts.processReturn.updateEquipment'
      )

      // 4. Auto-create repair tickets for damaged lines
      if (damagedItems.length > 0) {
        const repairInserts = damagedItems.map(item => ({
          equipment_id:   equipmentId,
          equipment_name: item.equipmentName,
          problem:        item.notes || 'Returned damaged — no description provided',
          status:         'Pending',
          notes:          `Auto-created from checkout return ${checkoutId}`,
          logged_at:      new Date().toISOString(),
        }))
        check(
          await supabase.from('repairs').insert(repairInserts),
          'checkouts.processReturn.createRepairs'
        )
        // Mark equipment under repair if all stock is damaged
        if (newAvail === 0) {
          check(
            await supabase.from('equipment').update({ status: 'Under Repair' }).eq('id', equipmentId),
            'checkouts.processReturn.markUnderRepair'
          )
        }
      }
    },
  },

  // ============================================================
  //  REPAIRS
  // ============================================================
  repairs: {
    async list() {
      const rows = check(
        await supabase.from('repairs').select('*').order('logged_at', { ascending: false }),
        'repairs.list'
      )
      return rows.map(toAppRepair)
    },

    async create(data) {
      const rows = check(
        await supabase.from('repairs').insert({
          equipment_id:   data.equipmentId,
          equipment_name: data.equipmentName,
          problem:        data.problem,
          status:         data.status || 'Pending',
          notes:          data.notes  || null,
          logged_at:      new Date().toISOString(),
        }).select(),
        'repairs.create'
      )
      // Mark equipment status
      check(
        await supabase.from('equipment').update({ status: 'Under Repair' }).eq('id', data.equipmentId),
        'repairs.create.updateEquipment'
      )
      return toAppRepair(rows[0])
    },

    async update(id, data) {
      const payload = {}
      if (data.status      !== undefined) payload.status      = data.status
      if (data.notes       !== undefined) payload.notes       = data.notes
      if (data.resolvedDate !== undefined) payload.resolved_at = data.resolvedDate

      const rows = check(
        await supabase.from('repairs').update(payload).eq('id', id).select(),
        'repairs.update'
      )
      const repair = toAppRepair(rows[0])

      // Restore to stock when Completed
      if (data.status === 'Completed') {
        const eq = check(
          await supabase.from('equipment').select('available').eq('id', repair.equipmentId).single(),
          'repairs.update.getEquipment'
        )
        check(
          await supabase.from('equipment').update({
            available: eq.available + 1,
            status:    'In Store',
          }).eq('id', repair.equipmentId),
          'repairs.update.restoreEquipment'
        )
      }
      return repair
    },
  },

  // ============================================================
  //  EVENTS
  // ============================================================
  events: {
    async list() {
      const [evRows, packRows] = await Promise.all([
        supabase.from('events').select('*').order('date'),
        supabase.from('event_packing').select('*').order('created_at'),
      ])
      const events   = check(evRows,  'events.list').map(r => {
        const packing = check(packRows, 'events.listPacking')
          .filter(p => p.event_id === r.id)
          .map(toAppPackingItem)
        return toAppEvent(r, packing)
      })
      return events
    },

    async create(data) {
      const rows = check(
        await supabase.from('events').insert({
          name:  data.name,
          date:  data.date,
          type:  data.type,
          sport: data.sport,
          venue: data.venue,
          notes: data.notes || null,
        }).select(),
        'events.create'
      )
      return toAppEvent(rows[0], [])
    },

    async update(id, data) {
      const payload = {}
      if (data.name  !== undefined) payload.name  = data.name
      if (data.date  !== undefined) payload.date  = data.date
      if (data.type  !== undefined) payload.type  = data.type
      if (data.sport !== undefined) payload.sport = data.sport
      if (data.venue !== undefined) payload.venue = data.venue
      if (data.notes !== undefined) payload.notes = data.notes

      check(
        await supabase.from('events').update(payload).eq('id', id),
        'events.update'
      )
    },

    async delete(id) {
      // Packing items cascade-delete via FK
      check(
        await supabase.from('events').delete().eq('id', id),
        'events.delete'
      )
    },
  },

  // ============================================================
  //  EVENT PACKING
  // ============================================================
  packing: {
    async add(eventId, item) {
      const rows = check(
        await supabase.from('event_packing').insert({
          event_id:       eventId,
          equipment_id:   item.equipmentId   || null,
          equipment_name: item.equipmentName,
          category:       item.category      || null,
          qty:            item.qty,
          notes:          item.notes         || null,
          packed:         false,
        }).select(),
        'packing.add'
      )
      return toAppPackingItem(rows[0])
    },

    async remove(itemId) {
      check(
        await supabase.from('event_packing').delete().eq('id', itemId),
        'packing.remove'
      )
    },

    async togglePacked(itemId, packed) {
      check(
        await supabase.from('event_packing').update({ packed }).eq('id', itemId),
        'packing.togglePacked'
      )
    },
  },

  // ============================================================
  //  ACTIVITY LOG
  // ============================================================
  activity: {
    async list(limit = 50) {
      const rows = check(
        await supabase
          .from('activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit),
        'activity.list'
      )
      return rows.map(toAppActivity)
    },

    async add(entry) {
      check(
        await supabase.from('activity_log').insert({
          type:   entry.type,
          text:   entry.text,
          detail: entry.detail || null,
          color:  entry.color  || 'info',
        }),
        'activity.add'
      )
    },
  },
}
