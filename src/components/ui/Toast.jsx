import { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'

const ICONS = {
  ok:    <CheckCircle size={15} />,
  warn:  <AlertTriangle size={15} />,
  error: <XCircle size={15} />,
  info:  <Info size={15} />,
}

function Toast({ id, type, title, message, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div
      className={`toast t-${type}`}
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.28s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <span className="toast-icon">{ICONS[type] || ICONS.info}</span>
      <div className="toast-body">
        <div className="toast-title">{title}</div>
        {message && <div className="toast-msg">{message}</div>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '2px', display: 'flex' }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
