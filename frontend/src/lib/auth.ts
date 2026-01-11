// Authentication utilities

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: 'agency' | 'client'
  date_joined: string
  agency?: {
    id: number
    name: string
    email: string
  }
  agencies?: Array<{
    agency_id: number
    agency_name: string
    permissions: Record<string, any>
  }>
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse {
  access: string
  refresh: string
  user: User
}

const TOKEN_KEY = 'auth_tokens'
const USER_KEY = 'auth_user'

/**
 * Store authentication tokens in localStorage
 */
export function setTokens(tokens: AuthTokens): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
  }
}

/**
 * Get stored authentication tokens
 */
export function getTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(TOKEN_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Remove authentication tokens
 */
export function removeTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

/**
 * Store user data in localStorage
 */
export function setUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

/**
 * Get stored user data
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(USER_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Remove user data
 */
export function removeUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY)
  }
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  removeTokens()
  removeUser()
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const tokens = getTokens()
  return tokens !== null && tokens.access !== null
}

/**
 * Check if access token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Convert to milliseconds
    return Date.now() >= exp
  } catch {
    return true
  }
}

/**
 * Get access token if valid, otherwise return null
 */
export function getValidAccessToken(): string | null {
  const tokens = getTokens()
  if (!tokens) return null

  if (isTokenExpired(tokens.access)) {
    return null
  }

  return tokens.access
}
