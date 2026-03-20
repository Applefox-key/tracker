import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function DemoBanner() {
  const mode   = useAuthStore((s) => s.mode)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  if (mode !== 'demo') return null

  function handleLogin() {
    logout()
    navigate('/login')
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-800">
      <span className="font-medium">Demo mode</span>
      {' — your changes are not saved. '}
      <button onClick={handleLogin} className="underline font-medium hover:text-amber-900">
        Log in
      </button>
      {' to save your progress.'}
    </div>
  )
}
