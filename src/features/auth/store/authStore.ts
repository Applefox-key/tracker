import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, LoginCredentials } from '../types'
import { authApi } from '@/api/api'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      mode: 'unauthenticated',
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      isInitializing: true,
      setInitializing: (v) => set({ isInitializing: v }),

      enterDemoMode: () => {
        set({ mode: 'demo', isAuthenticated: true, user: null, error: null })
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })
        try {
          await authApi.login(credentials)
          const user = await authApi.getUser()
          set({ mode: 'authenticated', isAuthenticated: true, user, isLoading: false })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Login failed.',
            isLoading: false,
          })
          throw err
        }
      },

      logout: () => {
        // For authenticated mode, fire-and-forget the server logout
        useAuthStore.getState().mode === 'authenticated' && authApi.logout().catch(() => void 0)
        set({ mode: 'unauthenticated', isAuthenticated: false, user: null, error: null })
      },
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        mode: state.mode,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
)
