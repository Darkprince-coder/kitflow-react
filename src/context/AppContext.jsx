import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import config from '../config.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('kitflow-theme') || 'dark')
  const [toasts, setToasts] = useState([])

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kitflow-theme', theme)
  }, [theme])

  // Apply brand colour from config
  useEffect(() => {
    document.documentElement.style.setProperty('--brand', config.brandColor)
    document.documentElement.style.setProperty('--brand-dim', config.brandColorDim)
    document.title = `KitFlow — ${config.clientName}`
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  const showToast = useCallback((type, title, message = '', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <AppContext.Provider value={{ theme, toggleTheme, toasts, showToast, dismissToast, config }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
