import { getTokens, setTokens, clearAuth, type AuthTokens } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const tokens = getTokens()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`
  }

  const url = `${API_URL}${endpoint}`

  try {
    const response = await fetch(url, { ...options, headers })

    if (response.status === 401 && tokens?.refresh) {
      const refreshed = await refreshAccessToken(tokens.refresh)
      if (refreshed) {
        headers['Authorization'] = `Bearer ${refreshed.access}`
        return fetch(url, { ...options, headers })
      } else {
        clearAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      }
    }

    return response
  } catch (error) {
    throw error
  }
}

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
        refresh: data.refresh || refreshToken,
      }
      setTokens(newTokens)
      return newTokens
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
  }
  return null
}

export const api = {
  // ===== Auth =====
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Login failed')
    return data
  },

  async agencySignup(data: {
    email: string; password: string; password_confirm: string;
    first_name: string; last_name: string; agency_name: string;
  }) {
    const response = await fetch(`${API_URL}/api/auth/agency/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // ===== User =====
  async getCurrentUser() {
    const response = await fetchWithAuth('/api/me/')
    if (!response.ok) throw new Error('Failed to get user')
    return response.json()
  },

  async updatePreferences(data: { dark_mode: boolean }) {
    const response = await fetchWithAuth('/api/me/preferences/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update preferences')
    return response.json()
  },

  // ===== Clients =====
  async createClient(data: {
    email: string; first_name: string; last_name: string; password?: string;
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

  async listClients() {
    const response = await fetchWithAuth('/api/clients/')
    if (!response.ok) throw new Error('Failed to list clients')
    return response.json()
  },

  async updateClientPermissions(clientId: number, permissions: {
    meta_accounts_ids?: string[]; google_accounts_ids?: string[]; ga4_properties_ids?: string[];
  }) {
    const response = await fetchWithAuth(`/api/clients/${clientId}/permissions/`, {
      method: 'PATCH',
      body: JSON.stringify(permissions),
    })
    if (!response.ok) throw new Error('Failed to update permissions')
    return response.json()
  },

  async removeClient(clientId: number) {
    const response = await fetchWithAuth(`/api/clients/${clientId}/`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to remove client')
    return response.json()
  },

  // ===== OAuth =====
  async getOAuthStatus() {
    const response = await fetchWithAuth('/api/oauth/status/')
    if (!response.ok) throw new Error('Failed to get OAuth status')
    return response.json()
  },

  async startMetaOAuth() {
    const response = await fetchWithAuth('/api/oauth/meta/start/')
    if (!response.ok) throw new Error('Failed to start Meta OAuth')
    return response.json()
  },

  async startGoogleOAuth() {
    const response = await fetchWithAuth('/api/oauth/google/start/')
    if (!response.ok) throw new Error('Failed to start Google OAuth')
    return response.json()
  },

  async startGA4OAuth() {
    const response = await fetchWithAuth('/api/oauth/ga4/start/')
    if (!response.ok) throw new Error('Failed to start GA4 OAuth')
    return response.json()
  },

  // ===== Meta Sync (Agency) =====
  async getAdAccounts() {
    const response = await fetchWithAuth('/api/meta/accounts/')
    if (!response.ok) throw new Error('Failed to get ad accounts')
    return response.json()
  },

  async triggerStructuralSync(accountIds: string[]) {
    const response = await fetchWithAuth('/api/meta/sync/structural/', {
      method: 'POST',
      body: JSON.stringify({ account_ids: accountIds }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to trigger structural sync')
    }
    return response.json()
  },

  async triggerInsightsSync(data: {
    account_ids: string[]; start_date: string; end_date: string;
  }) {
    const response = await fetchWithAuth('/api/meta/sync/insights/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to trigger insights sync')
    }
    return response.json()
  },

  // ===== Meta Client Data =====
  async getClientAccounts() {
    const response = await fetchWithAuth('/api/meta/client/accounts/')
    if (!response.ok) throw new Error('Failed to fetch accounts')
    return response.json()
  },

  async getClientCampaigns() {
    const response = await fetchWithAuth('/api/meta/client/campaigns/')
    if (!response.ok) throw new Error('Failed to fetch campaigns')
    return response.json()
  },

  async getClientAdsets() {
    const response = await fetchWithAuth('/api/meta/client/adsets/')
    if (!response.ok) throw new Error('Failed to fetch adsets')
    return response.json()
  },

  async getClientAds() {
    const response = await fetchWithAuth('/api/meta/client/ads/')
    if (!response.ok) throw new Error('Failed to fetch ads')
    return response.json()
  },

  async getClientInsights(params: {
    account_id?: string; level?: string; start_date?: string; end_date?: string;
  }) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString()
    const response = await fetchWithAuth(`/api/meta/client/insights/?${query}`)
    if (!response.ok) throw new Error('Failed to fetch insights')
    return response.json()
  },

  // ===== Client Dashboard Helpers =====
  async getClientAdAccountsNew() {
    const response = await fetchWithAuth('/api/meta/client/accounts/')
    if (!response.ok) throw new Error('Failed to fetch accounts')
    return response.json()
  },

  async getClientCampaignsNew(accountId: string) {
    const response = await fetchWithAuth(`/api/meta/client/campaigns/?account_id=${accountId}`)
    if (!response.ok) throw new Error('Failed to fetch campaigns')
    return response.json()
  },

  async getClientAdSetsNew(campaignIds: string[]) {
    const query = campaignIds.map(id => `campaign_id=${id}`).join('&')
    const response = await fetchWithAuth(`/api/meta/client/adsets/?${query}`)
    if (!response.ok) throw new Error('Failed to fetch adsets')
    return response.json()
  },

  async getClientAdsNew(adSetIds: string[]) {
    const query = adSetIds.map(id => `adset_id=${id}`).join('&')
    const response = await fetchWithAuth(`/api/meta/client/ads/?${query}`)
    if (!response.ok) throw new Error('Failed to fetch ads')
    return response.json()
  },

  async getClientCreativesNew(adIds: string[]) {
    const query = adIds.map(id => `ad_id=${id}`).join('&')
    const response = await fetchWithAuth(`/api/meta/client/ads/?${query}`)
    if (!response.ok) throw new Error('Failed to fetch creatives')
    const data = await response.json()
    // Extract creatives from ads with additional context
    const creatives = (data.ads || [])
      .filter((ad: any) => ad.creative)
      .map((ad: any) => ({
        ...ad.creative,
        ad_id: ad.ad_id,
        ad_name: ad.name,
        adset_id: ad.adset_id,
        campaign_id: ad.campaign_id,
        ad_account_id: ad.ad_account_id,
      }))
    return { creatives }
  },

  async getClientInsightsAggregate(params: {
    entities: Array<{ id: string; name: string; type: string; start_date: string; end_date: string }>;
    start_date: string;
    end_date: string;
  }) {
    const response = await fetchWithAuth('/api/meta/client/insights/', {
      method: 'POST',
      body: JSON.stringify(params),
    })
    if (!response.ok) throw new Error('Failed to fetch insights')
    return response.json()
  },
}

export { API_URL }
