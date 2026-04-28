import { Link, Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav.tsx'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight text-white">
            FitLife <span className="text-orange-400">Slim</span>
          </Link>
          <Link
            to="/profile"
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-orange-500/50 hover:text-orange-300"
          >
            Profile
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
