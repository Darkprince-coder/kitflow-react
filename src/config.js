// ============================================================
//  KitFlow — Client Configuration
//  Change these values per deployment. Everything else in the
//  app reads from this single file.
// ============================================================

const config = {
  // ── Client branding ──────────────────────────────────────
  clientName:    'Prime Sports',
  clientSub:     'Soccer Academy',
  clientLogoUrl: '',          // URL to logo image; leave '' to show placeholder

  // ── Brand colour ─────────────────────────────────────────
  // Applied as CSS variable throughout the entire app.
  brandColor:      '#2563EB',
  brandColorDim:   '#2563EB18',

  // ── Feature flags ────────────────────────────────────────
  // Set to false to hide a module entirely from the sidebar.
  features: {
    dashboard: true,
    equipment: true,
    checkout:  true,
    checkin:   true,
    repairs:   true,
    calendar:  true,
    borrowers: true,
    reports:   true,
  },

  // ── Terminology ──────────────────────────────────────────
  // Override labels to match client context.
  terms: {
    borrower:        'Player / Staff',
    borrowers:       'Players & Staff',
    borrowerIdLabel: 'ID Number',
    orgUnit:         'Team',           // "Class" for schools
  },

  // ── Supabase ─────────────────────────────────────────────
  supabase: {
    url:     import.meta.env.VITE_SUPABASE_URL     || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
}

export default config
