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
 * Log API request details to console
 */
function logRequest(method: string, url: string, hasAuth: boolean, body?: any) {
  console.group(`🌐 API Request: ${method} ${url}`)
  console.log('Timestamp:', new Date().toISOString())
  console.log('Full URL:', url)
  console.log('Method:', method)
  console.log('Has Auth:', hasAuth ? '✅ Bearer token' : '❌ No auth')
  if (body) {
    console.log('Body:', body)
  }
  console.groupEnd()
}

/**
 * Log API response details to console
 */
function logResponse(method: string, url: string, status: number, data?: any, error?: any) {
  const emoji = status >= 200 && status < 300 ? '✅' : '❌'
  console.group(`${emoji} API Response: ${method} ${url} - ${status}`)
  console.log('Timestamp:', new Date().toISOString())
  console.log('Status:', status)
  if (data) {
    console.log('Data:', data)
  }
  if (error) {
    console.error('Error:', error)
  }
  console.groupEnd()
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

  const method = options.method || 'GET'
  const url = `${API_URL}${endpoint}`
  const body = options.body ? JSON.parse(options.body as string) : undefined

  // Log request
  logRequest(method, endpoint, !!tokens?.access, body)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // Log response
    const clonedResponse = response.clone()
    try {
      const data = await clonedResponse.json()
      logResponse(method, endpoint, response.status, data)
    } catch {
      logResponse(method, endpoint, response.status)
    }

    // If unauthorized, try to refresh token
    if (response.status === 401 && tokens?.refresh) {
      console.log('🔄 Token expired, attempting refresh...')
      const refreshed = await refreshAccessToken(tokens.refresh)
      if (refreshed) {
        console.log('✅ Token refreshed successfully, retrying request...')
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${refreshed.access}`
        logRequest(method, endpoint, true, body)

        const retryResponse = await fetch(url, {
          ...options,
          headers,
        })

        // Log retry response
        const retryCloned = retryResponse.clone()
        try {
          const retryData = await retryCloned.json()
          logResponse(method, endpoint, retryResponse.status, retryData)
        } catch {
          logResponse(method, endpoint, retryResponse.status)
        }

        return retryResponse
      } else {
        // Refresh failed, clear auth and redirect to login
        console.error('❌ Token refresh failed, redirecting to login...')
        clearAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      }
    }

    return response
  } catch (error) {
    logResponse(method, endpoint, 0, undefined, error)
    throw error
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
  const endpoint = '/api/auth/refresh/'
  const url = `${API_URL}${endpoint}`
  const body = { refresh: refreshToken }

  logRequest('POST', endpoint, false, body)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const data = await response.json()
      logResponse('POST', endpoint, response.status, data)

      const newTokens: AuthTokens = {
        access: data.access,
        refresh: data.refresh || refreshToken, // Use new refresh if provided
      }
      setTokens(newTokens)
      return newTokens
    } else {
      const error = await response.json()
      logResponse('POST', endpoint, response.status, undefined, error)
    }
  } catch (error) {
    logResponse('POST', endpoint, 0, undefined, error)
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
    const endpoint = '/api/auth/agency/signup/'
    const url = `${API_URL}${endpoint}`

    logRequest('POST', endpoint, false, data)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()
      logResponse('POST', endpoint, response.status, responseData)

      return responseData
    } catch (error) {
      logResponse('POST', endpoint, 0, undefined, error)
      throw error
    }
  },

  /**
   * Login (both agency and client)
   */
  async login(email: string, password: string) {
    const endpoint = '/api/auth/login/'
    const url = `${API_URL}${endpoint}`
    const body = { email, password }

    logRequest('POST', endpoint, false, body)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const responseData = await response.json()

      if (!response.ok) {
        logResponse('POST', endpoint, response.status, undefined, responseData)
        throw new Error(responseData.detail || 'Login failed')
      }

      logResponse('POST', endpoint, response.status, responseData)
      return responseData
    } catch (error) {
      if (error instanceof Error && error.message !== 'Login failed') {
        logResponse('POST', endpoint, 0, undefined, error)
      }
      throw error
    }
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
   * Update user preferences (dark mode, etc.)
   */
  async updateUserPreferences(data: { dark_mode: boolean }) {
    const response = await fetchWithAuth('/api/me/preferences/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update preferences')
    }

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

  /**
   * Sync Meta data (campaigns, ad sets, ads, metrics)
   */
  async syncMetaData(days: number = 30) {
    const response = await fetchWithAuth('/api/integrations/meta/sync/', {
      method: 'POST',
      body: JSON.stringify({ days }),
    })

    if (!response.ok) {
      const error = await response.json()
      if (response.status === 429) {
        // Rate limit error
        throw new Error(error.message || 'Rate limit exceeded')
      }
      throw new Error(error.message || 'Failed to sync data')
    }

    return response.json()
  },

  /**
   * Get client metrics (for client users only)
   * Filtered by permissions and date range
   */
  async getClientMetrics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)

    const queryString = params.toString()
    const url = `/api/metrics/${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch metrics')
    }

    return response.json()
  },

  /**
   * Get client ad accounts (for client users only)
   * Returns ad account details with currency and campaign counts
   */
  async getClientAdAccounts() {
    const response = await fetchWithAuth('/api/client/ad-accounts/')

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch ad accounts')
    }

    return response.json()
  },

  /**
   * Get client campaigns (for client users only)
   * Filtered by permissions
   */
  async getClientCampaigns() {
    const response = await fetchWithAuth('/api/client/campaigns/')

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch campaigns')
    }

    return response.json()
  },

  /**
   * Get client ad sets (for client users only)
   * Filtered by permissions
   */
  async getClientAdSets() {
    const response = await fetchWithAuth('/api/client/ad-sets/')

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch ad sets')
    }

    return response.json()
  },

  /**
   * Get client ads (for client users only)
   * Filtered by permissions
   */
  async getClientAds() {
    const response = await fetchWithAuth('/api/client/ads/')

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch ads')
    }

    return response.json()
  },

  // ==================== API TESTING ENDPOINTS ====================
  // Development only - for testing Meta API calls

  /**
   * List all OAuth connected users
   */
  async testListOAuthUsers() {
    const response = await fetchWithAuth('/api/integrations/meta/test/users/')
    if (!response.ok) throw new Error('Failed to list OAuth users')
    return response.json()
  },

  /**
   * Test user info endpoint
   */
  async testUserInfo(data: { integration_id: number }) {
    const response = await fetchWithAuth('/api/integrations/meta/test/user-info/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to get user info')
    return response.json()
  },

  /**
   * Test businesses endpoint
   */
  async testBusinesses(data: { integration_id: number }) {
    const response = await fetchWithAuth('/api/integrations/meta/test/businesses/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to get businesses')
    return response.json()
  },

  /**
   * Test ad accounts endpoint
   */
  async testAdAccounts(data: { integration_id: number }) {
    const response = await fetchWithAuth('/api/integrations/meta/test/ad-accounts/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to get ad accounts')
    return response.json()
  },

  /**
   * Test campaigns endpoint
   */
  async testCampaigns(data: { integration_id: number; ad_account_id: string }) {
    const response = await fetchWithAuth('/api/integrations/meta/test/campaigns/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to get campaigns')
    return response.json()
  },

  /**
   * Test ad sets endpoint
   */
  async testAdSets(data: { integration_id: number; campaign_id: string }) {
    const response = await fetchWithAuth('/api/integrations/meta/test/ad-sets/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to get ad sets')
    return response.json()
  },

  /**
   * Test ads endpoint
   */
  async testAds(data: { integration_id: number; ad_set_id: string }) {
    const response = await fetchWithAuth('/api/integrations/meta/test/ads/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to get ads')
    return response.json()
  },

  /**
   * Test creatives endpoint
   */
  async testCreatives(data: { integration_id: number; creative_id: string }) {
    const response = await fetchWithAuth('/api/integrations/meta/test/creatives/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to get creative')
    return response.json()
  },

  /**
   * Test insights endpoint
   */
  async testInsights(data: {
    integration_id: number
    object_id: string
    start_date?: string
    end_date?: string
  }) {
    const response = await fetchWithAuth('/api/integrations/meta/test/insights/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to get insights')
    return response.json()
  },

  // ===== NEW META ADS API METHODS =====

  /**
   * Get sync status for agency
   */
  async getSyncStatus() {
    const response = await fetchWithAuth('/api/meta/sync/status/')
    if (!response.ok) throw new Error('Failed to get sync status')
    return response.json()
  },

  /**
   * Trigger structural sync (user, businesses, ad accounts, campaigns, adsets, ads, creatives)
   */
  async triggerStructuralSync() {
    const response = await fetchWithAuth('/api/meta/sync/structural/', {
      method: 'POST',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to trigger structural sync')
    }
    return response.json()
  },

  /**
   * Trigger insights sync for selected ad accounts
   */
  async triggerInsightsSync(data: {
    ad_account_ids: string[]
    start_date: string
    end_date: string
  }) {
    const response = await fetchWithAuth('/api/meta/sync/insights/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to trigger insights sync')
    }
    return response.json()
  },

  /**
   * Get ad accounts for agency (for selection in sync)
   */
  async getAgencyAdAccounts() {
    const response = await fetchWithAuth('/api/meta/ad-accounts/')
    if (!response.ok) throw new Error('Failed to get ad accounts')
    return response.json()
  },

  /**
   * Get ad accounts for client (new dashboard)
   */
  async getClientAdAccountsNew() {
    const response = await fetchWithAuth('/api/meta/client/ad-accounts/')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch ad accounts')
    }
    return response.json()
  },

  /**
   * Get campaigns for client by account ID
   */
  async getClientCampaignsNew(accountId: string) {
    const response = await fetchWithAuth(`/api/meta/client/campaigns/?account_id=${accountId}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch campaigns')
    }
    return response.json()
  },

  /**
   * Get ad sets for client by campaign IDs
   */
  async getClientAdSetsNew(campaignIds: string[]) {
    if (campaignIds.length === 0) {
      return { adsets: [] }
    }
    const params = campaignIds.map(id => `campaign_ids=${id}`).join('&')
    const response = await fetchWithAuth(`/api/meta/client/adsets/?${params}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch ad sets')
    }
    return response.json()
  },

  /**
   * Get ads for client by ad set IDs
   */
  async getClientAdsNew(adsetIds: string[]) {
    if (adsetIds.length === 0) {
      return { ads: [] }
    }
    const params = adsetIds.map(id => `adset_ids=${id}`).join('&')
    const response = await fetchWithAuth(`/api/meta/client/ads/?${params}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch ads')
    }
    return response.json()
  },

  /**
   * Get creatives for client by account ID
   */
  async getClientCreativesNew(accountId: string) {
    const response = await fetchWithAuth(`/api/meta/client/creatives/?account_id=${accountId}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch creatives')
    }
    return response.json()
  },

  /**
   * Get insights for client with filters
   */
  async getClientInsightsNew(params: {
    account_id: string
    level?: string
    start_date?: string
    end_date?: string
  }) {
    const query = new URLSearchParams({
      account_id: params.account_id,
      ...(params.level && { level: params.level }),
      ...(params.start_date && { start_date: params.start_date }),
      ...(params.end_date && { end_date: params.end_date }),
    }).toString()

    const response = await fetchWithAuth(`/api/meta/client/insights/?${query}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch insights')
    }
    return response.json()
  },
}

export { API_URL }