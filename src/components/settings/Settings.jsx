import { useState } from 'react'
import { Shield, Plus, Trash2, Info, Users, Tag } from 'lucide-react'
import { useData } from '../../context/DataContext.jsx'
import { useApp }  from '../../context/AppContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { catStyle } from '../../utils/constants.js'
import s from './Settings.module.css'

const ROLES = [
  {
    name: 'Admin',
    description: 'Full access to all features including deleting records, managing users, and changing settings. Typically the sports director or head of department.',
    permissions: ['Add / edit / delete equipment', 'Issue & return equipment', 'Manage borrower profiles', 'Delete repair tickets', 'Manage calendar events', 'View all reports', 'Manage app settings & categories'],
    color: 'var(--danger)',
    bg: 'var(--danger-bg)',
  },
  {
    name: 'Kit Manager',
    description: 'Day-to-day operations — checking equipment in and out, logging repairs, and managing the packing list for events.',
    permissions: ['Add / edit equipment', 'Issue & return equipment', 'Manage borrower profiles', 'Log and update repair tickets', 'Manage calendar events', 'View reports'],
    color: 'var(--brand)',
    bg: 'var(--brand-dim)',
  },
  {
    name: 'Coach',
    description: 'Read-only access to equipment availability and event schedules. Cannot issue or return equipment directly.',
    permissions: ['View equipment register', 'View active checkouts', 'View calendar events and packing lists', 'View reports'],
    color: 'var(--ok)',
    bg: 'var(--ok-bg)',
  },
]

export function Settings() {
  const { categories, addCategory } = useData()
  const { showToast } = useApp()
  const { session, isConfigured } = useAuth()
  const [newCat, setNewCat] = useState('')
  const [tab, setTab] = useState('roles')

  const handleAddCategory = () => {
    const trimmed = newCat.trim()
    if (!trimmed) return
    const ok = addCategory(trimmed)
    if (ok !== false) {
      showToast('ok', 'Category added', trimmed)
      setNewCat('')
    } else {
      showToast('warn', 'Already exists', trimmed)
    }
  }

  return (
    <div className={s.wrap}>

      {/* Tab bar */}
      <div className={s.tabs}>
        {['roles', 'categories', 'account'].map(t => (
          <button
            key={t}
            className={`${s.tab} ${tab === t ? s.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'roles' && <Shield size={14} />}
            {t === 'categories' && <Tag size={14} />}
            {t === 'account' && <Users size={14} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── ROLES TAB ── */}
      {tab === 'roles' && (
        <div className={s.section}>
          <div className={s.sectionHead}>
            <div className={s.sectionTitle}>User Roles</div>
            <div className={s.sectionSub}>
              Roles are assigned in Supabase Dashboard → Authentication → Users.
              Set the <code>role</code> field in the user's metadata when creating their account.
            </div>
          </div>

          {isConfigured ? (
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <Info size={14} />
              <div>
                <div className="alert-title">To assign a role</div>
                <div className="alert-body">
                  Go to your Supabase Dashboard → Authentication → Users → click a user → 
                  edit User Metadata → add <code style={{background:'var(--surface-3)',padding:'1px 5px',borderRadius:4}}>{`{"role":"admin"}`}</code> or <code style={{background:'var(--surface-3)',padding:'1px 5px',borderRadius:4}}>{`{"role":"kit_manager"}`}</code> or <code style={{background:'var(--surface-3)',padding:'1px 5px',borderRadius:4}}>{`{"role":"coach"}`}</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warn" style={{ marginBottom: 16 }}>
              <Info size={14} />
              <div>
                <div className="alert-title">Demo mode — roles not enforced</div>
                <div className="alert-body">Connect Supabase to enable real user accounts and role-based access.</div>
              </div>
            </div>
          )}

          <div className={s.roleGrid}>
            {ROLES.map(role => (
              <div key={role.name} className={s.roleCard}>
                <div className={s.roleHeader} style={{ borderLeftColor: role.color }}>
                  <div className={s.roleName} style={{ color: role.color }}>{role.name}</div>
                  <div className={s.roleDesc}>{role.description}</div>
                </div>
                <ul className={s.permList}>
                  {role.permissions.map(p => (
                    <li key={p} className={s.permItem}>
                      <span className={s.permDot} style={{ background: role.color }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CATEGORIES TAB ── */}
      {tab === 'categories' && (
        <div className={s.section}>
          <div className={s.sectionHead}>
            <div className={s.sectionTitle}>Sport Categories</div>
            <div className={s.sectionSub}>
              Categories are used to organise equipment, calendar events, and reports.
              Add any sport or equipment type your academy needs.
            </div>
          </div>

          <div className={s.addRow}>
            <input
              className="form-input"
              placeholder="New category name e.g. Swimming"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleAddCategory}>
              <Plus size={14} /> Add
            </button>
          </div>

          <div className={s.catGrid}>
            {categories.map(cat => {
              const cs = catStyle(cat)
              return (
                <div key={cat} className={s.catTag} style={{ background: cs.bg, color: cs.text, borderColor: cs.text + '30' }}>
                  {cat}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ACCOUNT TAB ── */}
      {tab === 'account' && (
        <div className={s.section}>
          <div className={s.sectionHead}>
            <div className={s.sectionTitle}>Account</div>
          </div>

          <div className={s.infoGrid}>
            <div className={s.infoRow}>
              <span className={s.infoLabel}>Signed in as</span>
              <span className={s.infoVal}>{session?.user?.email || 'Demo mode (not signed in)'}</span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoLabel}>Role</span>
              <span className={s.infoVal}>
                {session?.user?.user_metadata?.role || (isConfigured ? 'Not set — edit in Supabase Dashboard' : 'N/A (demo)')}
              </span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoLabel}>Supabase status</span>
              <span className={s.infoVal} style={{ color: isConfigured ? 'var(--ok)' : 'var(--warn)' }}>
                {isConfigured ? 'Connected' : 'Not configured — running in demo mode'}
              </span>
            </div>
            <div className={s.infoRow}>
              <span className={s.infoLabel}>App version</span>
              <span className={s.infoVal}>KitFlow v1.0</span>
            </div>
          </div>

          {isConfigured && (
            <div className="alert alert-info" style={{ marginTop: 16 }}>
              <Info size={14} />
              <div>
                <div className="alert-title">To change your password</div>
                <div className="alert-body">Go to Supabase Dashboard → Authentication → Users → find your email → Reset password.</div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
