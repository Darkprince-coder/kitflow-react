import { createClient } from '@supabase/supabase-js'
import config from '../config.js'

const { url, anonKey } = config.supabase

if (!url || !anonKey) {
  console.warn(
    '[KitFlow] Supabase credentials not set. ' +
    'Copy .env.example → .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'placeholder', {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
})
