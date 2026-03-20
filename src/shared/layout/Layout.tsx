import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { DemoBanner } from '@/features/auth/components/DemoBanner'
import { useEntriesData } from '@/hooks/useEntriesData'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/entries', label: 'Entries', icon: '📝' },
  { to: '/practice', label: 'Practice', icon: '🎯' },
  { to: '/about', label: 'About', icon: 'ℹ️' },
]

export function Layout() {
  const { isAuthenticated, mode, user, logout } = useAuthStore()
  const navigate = useNavigate()

  // Orchestrate data source — populates useEntriesStore based on auth mode
  useEntriesData()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <span className="text-xl font-bold text-indigo-600 tracking-tight">
            Language Progress
          </span>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  [
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  ].join(' ')
                }
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {isAuthenticated && (
            <div className="flex items-center gap-3 ml-3">
              {mode === 'authenticated' && user?.name && (
                <span className="hidden sm:block text-xs text-gray-500 truncate max-w-[120px]">
                  {user.name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                {mode === 'demo' ? 'Exit demo' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </header>

      <DemoBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        Language Progress — keep learning every day
      </footer>
    </div>
  )
}
