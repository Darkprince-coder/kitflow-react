import { useState, useEffect } from 'react'
import s from './InstallPrompt.module.css'

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow]                     = useState(false)
  const [dismissed, setDismissed]           = useState(false)

  useEffect(() => {
    // Don't show if already installed (running in standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) return

    // Don't show if user previously dismissed
    if (localStorage.getItem('kitflow-install-dismissed')) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Small delay so it doesn't pop up instantly on load
      setTimeout(() => setShow(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('kitflow-install-dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div className={s.banner}>
      {/* KitFlow logo mark */}
      <svg className={s.icon} viewBox="0 0 34 34" fill="none">
        <path
          d="M17 2L4 7.5V16C4 22.5 9.5 28.5 17 31C24.5 28.5 30 22.5 30 16V7.5L17 2Z"
          fill="var(--brand)" fillOpacity="0.2"
          stroke="var(--brand)" strokeWidth="1.5" strokeLinejoin="round"
        />
        <path
          d="M10 17L14.5 21.5L24 12"
          stroke="var(--brand)" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>

      <div className={s.text}>
        <div className={s.title}>Install KitFlow</div>
        <div className={s.sub}>Add to home screen for faster access</div>
      </div>

      <div className={s.actions}>
        <button className={s.btnInstall} onClick={install}>Install</button>
        <button className={s.btnDismiss} onClick={dismiss}>Not now</button>
      </div>
    </div>
  )
}
