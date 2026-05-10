import { Menu, Search, Bell, Plus } from 'lucide-react'
import { useRef } from 'react'
import s from './Topbar.module.css'

export function Topbar({ title, sub, onMenuClick, showSearch, searchValue, onSearch, ctaLabel, onCta }) {
  const searchRef = useRef()

  return (
    <header className={s.topbar}>
      <button className={`${s.menuBtn} hide-desktop`} onClick={onMenuClick} aria-label="Menu">
        <Menu size={20} />
      </button>

      <div className={s.pageInfo}>
        <div className={s.title}>{title}</div>
        {sub && <div className={s.sub}>{sub}</div>}
      </div>

      <div className={s.actions}>
        {showSearch && (
          <div className={s.searchWrap}>
            <Search size={14} className={s.searchIcon} />
            <input
              ref={searchRef}
              className={s.searchInput}
              placeholder="Search..."
              value={searchValue}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
        )}

        {ctaLabel && (
          <button className="btn btn-primary btn-sm" onClick={onCta}>
            <Plus size={14} />
            {ctaLabel}
          </button>
        )}

        <button className="btn-icon hide-mobile" title="Notifications">
          <Bell size={15} />
        </button>
      </div>
    </header>
  )
}
