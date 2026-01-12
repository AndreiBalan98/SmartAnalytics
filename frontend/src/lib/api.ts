// API utilities with authentication

import { getTokens, setTokens, clearAuth, type AuthTokens } from './auth'

/**
 * IMPORTANT: API_URL should point to the Django backend
 * Local: http://localhost:8000
 * Production: https://your-backend.onrender.com (NOT Vercel URL!)
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
  token?: string
}

/**
 * Make an authenticated API request
 */
async function fetchWithAuth(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const tokens = getTokens()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // Add Authorization header if token exists
  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // If unauthorized, try to refresh token
  if (response.status === 401 && tokens?.refresh) {
    const refreshed = await refreshAccessToken(tokens.refresh)
    if (refreshed) {
      // Retry original request with new token
      headers['Authorization'] = `Bearer ${refreshed.access}`
      return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })
    } else {
      // Refresh failed, clear auth and redirect to login
      clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  }

  return response
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (response.ok) {
      const data = await response.json()
      const newTokens: AuthTokens = {
        access: data.access,
        refresh: data.refresh || refreshToken, // Use new refresh if provided
      }
      setTokens(newTokens)
      return newTokens
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
  }

  return null
}

/**
 * API client methods
 */
export const api = {
  /**
   * Agency signup
   */
  async agencySignup(data: {
    email: string
    password: string
    password_confirm: string
    first_name: string
    last_name: string
    agency_name: string
  }) {
    const response = await fetch(`${API_URL}/api/auth/agency/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  /**
   * Login (both agency and client)
   */
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    return response.json()
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const response = await fetchWithAuth('/api/me/')
    if (!response.ok) throw new Error('Failed to get user')
    return response.json()
  },

  /**
   * Create client (agency only)
   */
  async createClient(data: {
    email: string
    first_name: string
    last_name: string
    password?: string
    permissions?: Record<string, any>
  }) {
    const response = await fetchWithAuth('/api/clients/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create client')
    }

    return response.json()
  },

  /**
   * List agency clients
   */
  async listClients() {
    const response = await fetchWithAuth('/api/clients/')
    if (!response.ok) throw new Error('Failed to list clients')
    return response.json()
  },

  /**
   * Update client permissions
   */
  async updateClientPermissions(clientId: number, permissions: Record<string, any>) {
    const response = await fetchWithAuth(`/api/clients/${clientId}/permissions/`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    })

    if (!response.ok) throw new Error('Failed to update permissions')
    return response.json()
  },

  /**
   * Remove client
   */
  async removeClient(clientId: number) {
    const response = await fetchWithAuth(`/api/clients/${clientId}/`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to remove client')
    return response.json()
  },

  /**
   * Get integrations status
   */
  async getIntegrationsStatus() {
    const response = await fetchWithAuth('/api/integrations/status/')
    if (!response.ok) throw new Error('Failed to get integrations')
    return response.json()
  },

  /**
   * Get Meta ad accounts
   */
  async getMetaAdAccounts() {
    const response = await fetchWithAuth('/api/integrations/meta/ad-accounts/')
    if (!response.ok) throw new Error('Failed to get Meta ad accounts')
    return response.json()
  },

  /**
   * Exchange Meta OAuth code for token
   */
  async exchangeMetaCode(code: string, redirectUri: string) {
    const response = await fetchWithAuth('/api/integrations/meta/exchange-code/', {
      method: 'POST',
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) throw new Error('Failed to exchange Meta code')
    return response.json()
  },
}

export { API_URL }