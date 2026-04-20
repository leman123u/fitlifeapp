import { NavLink } from 'react-router-dom'

const items = [
  {
    to: '/',
    label: 'Home',
    icon: IconHome,
  },
  {
    to: '/workouts',
    label: 'Workouts',
    icon: IconDumbbell,
  },
  {
    to: '/nutrition',
    label: 'Diet',
    icon: IconApple,
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: IconChart,
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: IconUser,
  },
] as const

function IconHome({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={active ? '#fb923c' : '#94a3b8'} strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" />
    </svg>
  )
}
function IconDumbbell({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={active ? '#fb923c' : '#94a3b8'} strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" d="M6 10h12M9 7v10M15 7v10M4 14h2M18 14h2M4 10h2M18 10h2" />
    </svg>
  )
}
function IconApple({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={active ? '#34d399' : '#94a3b8'} strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3c-1 2-2 3-4 3-2 0-4 2-4 6 0 4 3 8 8 10 5-2 8-6 8-10 0-4-2-6-4-6-2 0-3-1-4-3z"
      />
    </svg>
  )
}
function IconChart({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={active ? '#34d399' : '#94a3b8'} strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M9 19V9M14 19v-6M19 19V11" />
    </svg>
  )
}
function IconUser({ active }: { active: boolean }) {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={active ? '#fb923c' : '#94a3b8'} strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0M4 20a8 8 0 1116 0H4z" />
    </svg>
  )
}

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-lg safe-area-pb"
      aria-label="Main"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition sm:text-xs ${
                isActive ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
