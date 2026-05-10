export function StatCard({ icon, value, label, sub, variant = 's-brand' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-icon-wrap">{icon}</div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
