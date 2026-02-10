export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: 'client' | 'agency' | 'agency_client'
  dark_mode: boolean
  agency_name: string | null
  agency_id: number | null
  date_joined: string
  permissions?: {
    meta_accounts_ids: string[]
    google_accounts_ids: string[]
    ga4_properties_ids: string[]
  }
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

export function setTokens(tokens: AuthTokens): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
  }
}

export function getTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(TOKEN_KEY)
  if (!stored) return null
  try { return JSON.parse(stored) } catch { return null }
}

export function removeTokens(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY)
}

export function setUser(user: User): void {
  if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(USER_KEY)
  if (!stored) return null
  try { return JSON.parse(stored) } catch { return null }
}

export function removeUser(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(USER_KEY)
}

export function clearAuth(): void {
  removeTokens()
  removeUser()
}

export function isAuthenticated(): boolean {
  const tokens = getTokens()
  return tokens !== null && tokens.access !== null
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch { return true }
}

export function getValidAccessToken(): string | null {
  const tokens = getTokens()
  if (!tokens) return null
  if (isTokenExpired(tokens.access)) return null
  return tokens.access
}

// Dark Mode
const DARK_MODE_KEY = 'dark_mode_preference'

export function applyDarkMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  if (enabled) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function setDarkModePreference(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DARK_MODE_KEY, JSON.stringify(enabled))
  applyDarkMode(enabled)
}

export function getDarkModePreference(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(DARK_MODE_KEY)
  if (!stored) return false
  try { return JSON.parse(stored) } catch { return false }
}

export function clearDarkModePreference(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DARK_MODE_KEY)
  applyDarkMode(false)
}
