import { FormEvent, useState } from 'react'
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { authApi } from '@/api/api'

type Mode = 'login' | 'register' | 'forgot'

// ── Reusable field wrapper ─────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ── Password input with show/hide toggle ───────────────────────────────────

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')

  // Login state
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginErrors, setLoginErrors]     = useState<{ email?: string; password?: string }>({})

  // Register state
  const [regName, setRegName]         = useState('')
  const [regEmail, setRegEmail]       = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regErrors, setRegErrors]     = useState<{ name?: string; email?: string; password?: string; general?: string }>({})
  const [regLoading, setRegLoading]   = useState(false)

  // Forgot password state
  const [forgotEmail, setForgotEmail]     = useState('')
  const [forgotError, setForgotError]     = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const { login, enterDemoMode, isLoading: loginLoading, error: loginStoreError } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to={from} replace />

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    const errors: typeof loginErrors = {}
    if (!loginEmail.trim())    errors.email    = 'Email is required.'
    if (!loginPassword.trim()) errors.password = 'Password is required.'
    if (Object.keys(errors).length) { setLoginErrors(errors); return }
    setLoginErrors({})

    try {
      await login({ email: loginEmail, password: loginPassword })
      navigate(from, { replace: true })
    } catch {
      // error is already set in the store
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    const errors: typeof regErrors = {}
    if (!regName.trim())     errors.name     = 'Name is required.'
    if (!regEmail.trim())    errors.email    = 'Email is required.'
    if (!regPassword.trim()) errors.password = 'Password is required.'
    else if (regPassword.length < 6) errors.password = 'Password must be at least 6 characters.'
    if (Object.keys(errors).length) { setRegErrors(errors); return }
    setRegErrors({})
    setRegLoading(true)

    try {
      await authApi.register({ name: regName, email: regEmail, password: regPassword })
      await login({ email: regEmail, password: regPassword })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setRegErrors({ general: err instanceof Error ? err.message : 'Registration failed.' })
    } finally {
      setRegLoading(false)
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault()
    if (!forgotEmail.trim()) { setForgotError('Email is required.'); return }
    setForgotError('')
    setForgotLoading(true)

    try {
      await authApi.sendPasswordResetEmail(forgotEmail)
      setForgotSuccess(true)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Failed to send reset email.')
    } finally {
      setForgotLoading(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setLoginErrors({})
    setRegErrors({})
    setForgotError('')
    setForgotSuccess(false)
  }

  const subtitles: Record<Mode, string> = {
    login:    'Sign in to continue learning',
    register: 'Create your account',
    forgot:   'Reset your password',
  }

  // ── Shared classes ───────────────────────────────────────────────────────

  const inputCls =
    'border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent'
  const primaryBtn =
    'mt-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors'
  const linkBtn =
    'text-indigo-600 hover:text-indigo-800 font-medium transition-colors'

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-indigo-600 tracking-tight">Language Progress</span>
          <p className="text-gray-500 mt-2 text-sm">{subtitles[mode]}</p>
          <Link to="/about" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors mt-1 inline-block">
            ← About the app
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6">

          {/* ── Login ── */}
          {mode === 'login' && (
            <>
              <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>

              <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
                <Field label="Email" htmlFor="login-email" error={loginErrors.email}>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </Field>

                <Field label="Password" htmlFor="login-password" error={loginErrors.password}>
                  <PasswordInput
                    id="login-password"
                    value={loginPassword}
                    onChange={setLoginPassword}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="self-end text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </Field>

                {loginStoreError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {loginStoreError}
                  </p>
                )}

                <button type="submit" disabled={loginLoading} className={primaryBtn}>
                  {loginLoading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-sm text-center text-gray-500">
                Don&apos;t have an account?{' '}
                <button onClick={() => switchMode('register')} className={linkBtn}>
                  Sign up
                </button>
              </p>

              <div className="flex items-center gap-3">
                <hr className="flex-1 border-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <hr className="flex-1 border-gray-200" />
              </div>

              <div className="flex flex-col gap-2 text-center">
                <button
                  type="button"
                  onClick={() => { enterDemoMode(); navigate('/dashboard', { replace: true }) }}
                  className="w-full border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                >
                  Try demo
                </button>
                <p className="text-xs text-gray-400">Explore with sample data — no account needed</p>
              </div>
            </>
          )}

          {/* ── Register ── */}
          {mode === 'register' && (
            <>
              <h1 className="text-xl font-semibold text-gray-900">Create account</h1>

              <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
                <Field label="Name" htmlFor="reg-name" error={regErrors.name}>
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </Field>

                <Field label="Email" htmlFor="reg-email" error={regErrors.email}>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </Field>

                <Field label="Password" htmlFor="reg-password" error={regErrors.password}>
                  <PasswordInput
                    id="reg-password"
                    value={regPassword}
                    onChange={setRegPassword}
                    autoComplete="new-password"
                  />
                </Field>

                {regErrors.general && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {regErrors.general}
                  </p>
                )}

                <button type="submit" disabled={regLoading} className={primaryBtn}>
                  {regLoading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="text-sm text-center text-gray-500">
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className={linkBtn}>
                  Sign in
                </button>
              </p>
            </>
          )}

          {/* ── Forgot password ── */}
          {mode === 'forgot' && (
            <>
              <h1 className="text-xl font-semibold text-gray-900">Reset password</h1>

              {forgotSuccess ? (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-3">
                    Check your email for reset instructions.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="flex flex-col gap-4" noValidate>
                  <Field label="Email" htmlFor="forgot-email" error={forgotError}>
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                    />
                  </Field>

                  <button type="submit" disabled={forgotLoading} className={primaryBtn}>
                    {forgotLoading ? 'Sending…' : 'Send reset link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
