import { createClient } from '@supabase/supabase-js'
import config from '../config.js'

const { url, anonKey } = config.supabase

const DUMMY_URL = 'https://placeholder.supabase.co'
const DUMMY_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

export const supabase = createClient(
  url || DUMMY_URL,
  anonKey || DUMMY_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
)
