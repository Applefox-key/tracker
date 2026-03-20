import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function DemoBanner() {
  const mode = useAuthStore((s) => s.mode)

  if (mode !== 'demo') return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-sm text-amber-800">
      <span className="font-medium">Demo mode</span>
      {' — your changes are not saved. '}
      <Link to="/login" className="underline font-medium hover:text-amber-900">
        Log in
      </Link>
      {' to save your progress.'}
    </div>
  )
}
