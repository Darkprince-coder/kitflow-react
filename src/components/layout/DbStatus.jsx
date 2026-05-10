import { useData } from '../../context/DataContext.jsx'
import s from './DbStatus.module.css'

export function DbStatus() {
  const { dbOnline, dbReady, dbError } = useData()

  if (!dbReady) return (
    <div className={s.pill} title="Connecting to database...">
      <span className={`${s.dot} ${s.dotLoading}`} />
      <span className={s.label}>Connecting</span>
    </div>
  )

  if (dbOnline) return (
    <div className={s.pill} title="Connected to Supabase">
      <span className={`${s.dot} ${s.dotOnline}`} />
      <span className={s.label}>Live</span>
    </div>
  )

  return (
    <div className={s.pill} title={dbError ? `DB error: ${dbError}` : 'Running on local demo data'}>
      <span className={`${s.dot} ${s.dotOffline}`} />
      <span className={s.label}>Demo</span>
    </div>
  )
}
