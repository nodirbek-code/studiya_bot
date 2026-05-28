import { useLocation, useNavigate } from 'react-router-dom'
import { clsx } from '@/utils'

const TABS = [
  { path: '/',        icon: HomeIcon,     label: 'Bosh' },
  { path: '/catalog', icon: GridIcon,     label: 'Portfolio' },
  { path: '/booking', icon: CalendarIcon, label: 'Bron' },
  { path: '/profile', icon: UserIcon,     label: 'Profil' },
  { path: '/about',   icon: InfoIcon,     label: 'Haqida' },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-white/5 flex z-50">
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = pathname === path || (path !== '/' && pathname.startsWith(path))
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors',
              active ? 'text-accent' : 'text-text-muted',
            )}
          >
            <Icon active={active} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Inline SVG icons ───────────────────────────────────────────
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
  )
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function InfoIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="8" strokeLinecap="round" strokeWidth="2.5" />
      <line x1="12" y1="12" x2="12" y2="16" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}
