import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import config from '../../config.js'
import s from './Login.module.css'

export function Login() {
  const { signIn, authError, setAuthError, loading } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [busy,     setBusy]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setBusy(true)
    await signIn(email.trim(), password)
    setBusy(false)
  }

  if (loading) return (
    <div className={s.splash}>
      <div className={s.splashDot} />
    </div>
  )

  return (
    <div className={s.page}>
      <div className={s.card}>

        {/* KitFlow logo mark */}
        <div className={s.logoWrap}>
          <svg className={s.logo} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17 2L4 7.5V16C4 22.5 9.5 28.5 17 31C24.5 28.5 30 22.5 30 16V7.5L17 2Z"
              fill="var(--brand)" fillOpacity="0.15"
              stroke="var(--brand)" strokeWidth="1.5" strokeLinejoin="round"
            />
            <path
              d="M10 17L14.5 21.5L24 12"
              stroke="var(--brand)" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round"
            />
            <circle cx="10" cy="17" r="1.5" fill="var(--brand)" fillOpacity="0.6" />
            <circle cx="17" cy="10" r="1.2" fill="var(--brand)" fillOpacity="0.35" />
          </svg>
          <div className={s.brandName}>Kit<span>Flow</span></div>
        </div>

        {/* Client name */}
        <div className={s.clientRow}>
          <div className={s.clientName}>{config.clientName}</div>
          <div className={s.clientSub}>{config.clientSub}</div>
        </div>

        <h1 className={s.title}>Sign in</h1>
        <p className={s.sub}>Use your staff account to access the equipment system.</p>

        <form className={s.form} onSubmit={handleSubmit} noValidate>
          <div className={s.formGroup}>
            <label className={s.label}>Email address</label>
            <input
              className={s.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setAuthError('') }}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className={s.formGroup}>
            <label className={s.label}>Password</label>
            <input
              className={s.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setAuthError('') }}
              autoComplete="current-password"
              required
            />
          </div>

          {authError && (
            <div className={s.error}>
              {authError}
            </div>
          )}

          <button
            className={s.btn}
            type="submit"
            disabled={busy || !email || !password}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className={s.footer}>
          Contact your administrator to create or reset your account.
        </div>
      </div>
    </div>
  )
}
