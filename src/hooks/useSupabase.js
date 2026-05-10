// ============================================================
//  useSupabase
//  Loads all initial data from Supabase when credentials are
//  configured. Falls back to seed data silently when not.
//  Every component in the app continues to work either way.
// ============================================================
import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/db.js'
import config from '../config.js'

const isConfigured = () =>
  Boolean(config.supabase.url && config.supabase.url !== 'YOUR_SUPABASE_URL' &&
          config.supabase.anonKey && config.supabase.anonKey !== 'YOUR_SUPABASE_ANON_KEY')

export function useSupabase() {
  const [ready,   setReady]   = useState(false)
  const [online,  setOnline]  = useState(false)
  const [error,   setError]   = useState(null)

  // Loaded state — mirrors DataContext shape
  const [dbEquipment,  setDbEquipment]  = useState(null)
  const [dbBorrowers,  setDbBorrowers]  = useState(null)
  const [dbCheckouts,  setDbCheckouts]  = useState(null)
  const [dbRepairs,    setDbRepairs]    = useState(null)
  const [dbEvents,     setDbEvents]     = useState(null)
  const [dbActivity,   setDbActivity]   = useState(null)
  const [dbCategories, setDbCategories] = useState(null)

  const load = useCallback(async () => {
    if (!isConfigured()) {
      setOnline(false)
      setReady(true)
      return
    }
    try {
      const [equipment, borrowers, checkouts, repairs, events, activity, categories] =
        await Promise.all([
          db.equipment.list(),
          db.borrowers.list(),
          db.checkouts.list(),
          db.repairs.list(),
          db.events.list(),
          db.activity.list(),
          db.categories.list(),
        ])
      setDbEquipment(equipment)
      setDbBorrowers(borrowers)
      setDbCheckouts(checkouts)
      setDbRepairs(repairs)
      setDbEvents(events)
      setDbActivity(activity)
      setDbCategories(categories)
      setOnline(true)
      setError(null)
    } catch (err) {
      console.warn('[KitFlow] Supabase load failed — using local seed data.', err.message)
      setOnline(false)
      setError(err.message)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return {
    ready, online, error, reload: load,
    dbEquipment, dbBorrowers, dbCheckouts,
    dbRepairs, dbEvents, dbActivity, dbCategories,
  }
}
