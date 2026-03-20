import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/api'
import type { LoginCredentials } from '@/features/auth/types'

const USER_KEY = ['user'] as const

/** Fetch the currently authenticated user. */
export function useUser() {
  return useQuery({
    queryKey: USER_KEY,
    queryFn: authApi.getUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

/** Login mutation — stores token then refetches the user. */
export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USER_KEY })
      navigate('/dashboard', { replace: true })
    },
  })
}

/** Logout mutation — clears server session and local cache. */
export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })
}
