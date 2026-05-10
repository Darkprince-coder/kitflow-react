import { format, formatDistanceToNow, differenceInDays, parseISO, isValid } from 'date-fns'

// ── ISO helpers ───────────────────────────────────────────────
export const todayISO      = () => format(new Date(), 'yyyy-MM-dd')
export const nowISO        = () => new Date().toISOString()                  // full timestamp
export const addDaysISO    = (n) => format(new Date(Date.now() + n * 86400000), 'yyyy-MM-dd')

// ── Formatting ────────────────────────────────────────────────
export const fmt = (dateStr, pattern = 'd MMM yyyy') => {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return isValid(d) ? format(d, pattern) : '—'
  } catch { return '—' }
}

export const fmtShort     = (dateStr) => fmt(dateStr, 'd MMM')
export const fmtDateTime  = (dateStr) => fmt(dateStr, 'd MMM yyyy, HH:mm')   // e.g. 12 Jun 2026, 14:35
export const fmtTime      = (dateStr) => fmt(dateStr, 'HH:mm')               // e.g. 14:35
export const fmtFull      = (dateStr) => fmt(dateStr, 'd MMM yyyy HH:mm:ss') // full precision

export const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true }) }
  catch { return '' }
}

// ── Calculations ──────────────────────────────────────────────
export const daysUntil = (dateStr) => {
  if (!dateStr) return null
  try { return differenceInDays(parseISO(dateStr.split('T')[0]), new Date(new Date().toDateString())) }
  catch { return null }
}

export const daysAgo = (dateStr) => {
  if (!dateStr) return null
  try { return differenceInDays(new Date(), parseISO(dateStr)) }
  catch { return null }
}

// ── Due badge ─────────────────────────────────────────────────
export const dueBadgeProps = (dueDate, returned) => {
  if (returned) return { label: 'Returned', cls: 'badge-ok' }
  const d = daysUntil(dueDate)
  if (d === null)  return { label: 'Unknown',            cls: 'badge-neutral' }
  if (d < 0)       return { label: `Overdue ${Math.abs(d)}d`, cls: 'badge-danger' }
  if (d === 0)     return { label: 'Due today',          cls: 'badge-warn' }
  if (d <= 3)      return { label: `Due in ${d}d`,       cls: 'badge-warn' }
  return                  { label: `Due in ${d}d`,       cls: 'badge-info' }
}

// ── Stock class ───────────────────────────────────────────────
export const stockClass = (available, minStock) => {
  if (available === 0)       return 'stock-danger'
  if (available <= minStock) return 'stock-warn'
  return                            'stock-ok'
}
