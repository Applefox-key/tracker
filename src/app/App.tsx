import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'

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
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
