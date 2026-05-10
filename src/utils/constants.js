// ── Category colours ─────────────────────────────────────────
// Sport-based categories. Custom ones added by users fall back
// to a generated colour from the palette below.

export const CAT_COLORS = {
  'Football':        { bg: '#172554', text: '#60A5FA' },
  'Rugby':           { bg: '#1c0404', text: '#F87171' },
  'Netball':         { bg: '#14401e', text: '#4ADE80' },
  'Volleyball':      { bg: '#1a1a2e', text: '#A78BFA' },
  'Badminton':       { bg: '#1c1003', text: '#FBBF24' },
  'Tennis':          { bg: '#0c1a2e', text: '#38BDF8' },
  'Athletics':       { bg: '#1f1404', text: '#FB923C' },
  'Swimming':        { bg: '#041c1a', text: '#2DD4BF' },
  'Basketball':      { bg: '#1a0a04', text: '#FB923C' },
  'Hockey':          { bg: '#0a1f0a', text: '#86EFAC' },
  'Medical':         { bg: '#2a0a14', text: '#FB7185' },
  'General':         { bg: '#1e1e26', text: '#94A3B8' },
}

// Fallback palette for user-added categories (cycles through)
const CUSTOM_PALETTE = [
  { bg: '#1a1204', text: '#FCD34D' },
  { bg: '#04141a', text: '#67E8F9' },
  { bg: '#1a0418', text: '#F0ABFC' },
  { bg: '#041a14', text: '#6EE7B7' },
  { bg: '#1a0404', text: '#FCA5A5' },
  { bg: '#0c0c1a', text: '#C4B5FD' },
]

const _customColorIndex = {}
let _nextColorIdx = 0

export const catStyle = (category) => {
  if (CAT_COLORS[category]) return CAT_COLORS[category]
  if (!_customColorIndex[category]) {
    _customColorIndex[category] = CUSTOM_PALETTE[_nextColorIdx % CUSTOM_PALETTE.length]
    _nextColorIdx++
  }
  return _customColorIndex[category]
}

// ── Default category list — stored in DataContext so it's mutable ──
// Exported here only as the initial seed value.
export const DEFAULT_CATEGORIES = [
  'Football',
  'Rugby',
  'Netball',
  'Volleyball',
  'Badminton',
  'Tennis',
  'Athletics',
  'Medical',
  'General',
]

// ── Badges ───────────────────────────────────────────────────
export const STATUS_BADGE = {
  'In Store':     'badge-ok',
  'Checked Out':  'badge-info',
  'Under Repair': 'badge-warn',
  'Lost':         'badge-danger',
}

export const CONDITION_BADGE = {
  'New':  'badge-brand',
  'Good': 'badge-ok',
  'Fair': 'badge-warn',
  'Poor': 'badge-danger',
}

export const REPAIR_STATUS_BADGE = {
  'Pending':        'badge-neutral',
  'In Progress':    'badge-warn',
  'Repaired':       'badge-ok',
  'Not Repairable': 'badge-danger',
}

export const EVENT_TYPE_BADGE = {
  'Match':      'badge-danger',
  'Training':   'badge-ok',
  'Tournament': 'badge-warn',
  'Term':       'badge-info',
  'Other':      'badge-neutral',
}

export const CONDITIONS  = ['New', 'Good', 'Fair', 'Poor']
export const EVENT_TYPES = ['Match', 'Training', 'Tournament', 'Term', 'Other']
export const ROLES       = ['Player', 'Staff', 'Coach', 'Volunteer']
