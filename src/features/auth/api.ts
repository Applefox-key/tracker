import { LoginCredentials, User } from './types'

/** Simulates a network delay */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Mock login API.
 * Replace the body of this function with a real fetch() call when a backend is available.
 * Accepts any non-empty email + password combination.
 */
export async function loginApi(credentials: LoginCredentials): Promise<User> {
  await delay(600)

  const { email, password } = credentials

  if (!email.trim() || !password.trim()) {
    throw new Error('Email and password are required.')
  }

  // Mock: derive a display name from the email prefix
  const name = email.split('@')[0].replace(/[._-]/g, ' ')

  return {
    id: crypto.randomUUID(),
    email: email.trim().toLowerCase(),
    name,
  }
}

/**
 * Mock logout API.
 * Replace with a real call (e.g. invalidate session token) when a backend is available.
 */
export async function logoutApi(): Promise<void> {
  await delay(100)
}
