import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { useAuthStore } from '@/features/auth/store/authStore'
import { authApi } from '@/api/api'
import { TOKEN_KEY } from '@/api/client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 4xx errors (auth failures, not-found, etc.)
      retry: (failureCount, error) => {
        if (error instanceof Error && /4\d\d/.test(error.message)) return false
        return failureCount < 2
      },
    },
  },
})

export function App() {
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const { mode } = useAuthStore.getState()

    if (!token && mode === 'unauthenticated') {
      // No token in localStorage — try cookie auth (cross-project SSO)
      authApi.getUser()
        .then((user) => {
          useAuthStore.setState({
            mode: 'authenticated',
            isAuthenticated: true,
            user,
          })
        })
        .catch(() => {
          // No valid cookie — stay unauthenticated, show login page
        })
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
