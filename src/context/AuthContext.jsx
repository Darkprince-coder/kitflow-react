import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import config from '../config.js'

const AuthContext = createContext(null)

const isConfigured = () =>
  Boolean(
    config.supabase.url &&
    config.supabase.url !== 'YOUR_SUPABASE_URL' &&
    config.supabase.anonKey &&
    config.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY'
  )

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    // If Supabase isn't configured, skip auth entirely (demo mode)
    if (!isConfigured()) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    return !error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  // In demo mode (no Supabase configured), always treat as authenticated
  const isAuthenticated = !isConfigured() || Boolean(session)

  return (
    <AuthContext.Provider value={{
      session,
      loading,
      authError,
      isAuthenticated,
      isConfigured: isConfigured(),
      signIn,
      signOut,
      setAuthError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
