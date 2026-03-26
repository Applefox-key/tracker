export type AuthMode = 'unauthenticated' | 'demo' | 'authenticated'

export interface User {
  id: string
  email: string
  name: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthState {
  mode: AuthMode
  /** true when mode is 'demo' or 'authenticated' */
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  error: string | null
  isInitializing: boolean
  setInitializing: (v: boolean) => void
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  enterDemoMode: () => void
}
