import { FormEvent, useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'

export function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState('')

  const { login, enterDemoMode, isLoading, error, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'
  if (isAuthenticated) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFieldError('')

    if (!email.trim() || !password.trim()) {
      setFieldError('Please enter both email and password.')
      return
    }

    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch {
      // error is already set in the store
    }
  }

  function handleDemo() {
    enterDemoMode()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / branding */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-indigo-600 tracking-tight">
            Language Progress
          </span>
          <p className="text-gray-500 mt-2 text-sm">Sign in to continue learning</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6">
          <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            {(fieldError || error) && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {fieldError || error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          {/* Demo mode */}
          <div className="flex flex-col gap-2 text-center">
            <button
              type="button"
              onClick={handleDemo}
              className="w-full border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              Try demo
            </button>
            <p className="text-xs text-gray-400">
              Explore with sample data — no account needed
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
