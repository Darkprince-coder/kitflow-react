export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="empty-state">
      {icon && <span style={{ opacity: 0.35 }}>{icon}</span>}
      {title    && <div className="empty-state-title">{title}</div>}
      {subtitle && <div className="empty-state-sub">{subtitle}</div>}
      {action}
    </div>
  )
}
