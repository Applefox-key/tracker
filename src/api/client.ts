import axios from 'axios'

const BASE_URL = 'https://api.learnapp.pro'
// export const BASE_URL = "http://localhost:8000";
export const TOKEN_KEY = 'tokentracker'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach Bearer token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
apiClient.interceptors.request.use((config) => {
  if (config.data && config.method !== 'get') {
    config.data = { data: config.data }
  }
  return config
})
// Normalise errors; redirect on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error. Please check your connection.')
      }
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.setItem('Auth', 'false')
        localStorage.removeItem('auth') // clear Zustand auth persist key
        window.location.href = '/login'
      }
      const message: unknown = error.response?.data?.error
      throw new Error(typeof message === 'string' ? message : 'An unexpected error occurred.')
    }
    throw error
  }
)
