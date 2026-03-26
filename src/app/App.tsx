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
    const { mode, setInitializing } = useAuthStore.getState()

    if (token || mode !== 'unauthenticated') {
      // Already authenticated via localStorage — no cookie check needed
      setInitializing(false)
    } else {
      // No token — try cookie auth
      authApi.getUser()
        .then((user) => {
          useAuthStore.setState({
            mode: 'authenticated',
            isAuthenticated: true,
            user,
          })
        })
        .catch(() => {
          // No valid cookie — stay unauthenticated
        })
        .finally(() => setInitializing(false))
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
