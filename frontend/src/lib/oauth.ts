import { api } from './api'

export interface OAuthResult {
  success: boolean
  userName?: string
  userId?: string
  userOpenId?: string
  error?: string
}

type OAuthMessageType =
  | 'META_OAUTH_SUCCESS' | 'META_OAUTH_ERROR'
  | 'GOOGLE_ADS_OAUTH_SUCCESS' | 'GOOGLE_ADS_OAUTH_ERROR'
  | 'GA4_OAUTH_SUCCESS' | 'GA4_OAUTH_ERROR'

interface OAuthMessage {
  type: OAuthMessageType
  userName?: string
  userId?: string
  userOpenId?: string
  error?: string
}

function openOAuthPopup(
  url: string, title: string,
  successType: OAuthMessageType, errorType: OAuthMessageType
): Promise<OAuthResult> {
  return new Promise((resolve, reject) => {
    // Clear any previous OAuth result from localStorage
    localStorage.removeItem('oauth_result')

    const width = 600, height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2
    const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,resizable=yes,scrollbars=yes`

    const popup = window.open(url, title, features)
    if (!popup) {
      reject(new Error('Failed to open OAuth popup. Please allow popups for this site.'))
      return
    }

    let resolved = false

    const cleanup = () => {
      window.removeEventListener('message', messageHandler)
      clearInterval(checkClosed)
      clearTimeout(timeoutId)
    }

    // Timeout after 5 minutes
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        reject(new Error('OAuth timeout - no response received'))
      }
    }, 5 * 60 * 1000)

    const handleResult = (data: OAuthMessage) => {
      if (resolved) return
      resolved = true
      cleanup()
      localStorage.removeItem('oauth_result')
      if (data.type === successType) {
        resolve({ success: true, userName: data.userName, userId: data.userId, userOpenId: data.userOpenId })
      } else if (data.type === errorType) {
        resolve({ success: false, error: data.error || 'OAuth failed' })
      }
    }

    // Method 1: postMessage from popup
    const messageHandler = (event: MessageEvent<OAuthMessage>) => {
      if (event.data?.type === successType || event.data?.type === errorType) {
        handleResult(event.data)
      }
    }
    window.addEventListener('message', messageHandler)

    // Method 2: Check localStorage when popup closes (fallback for when window.opener is null)
    const checkClosed = setInterval(() => {
      try {
        // Try to check if popup is closed (may throw COOP error)
        if (popup.closed) {
          clearInterval(checkClosed)
          // Give postMessage a moment to arrive first
          setTimeout(() => {
            if (resolved) return
            // Check localStorage fallback
            const stored = localStorage.getItem('oauth_result')
            if (stored) {
              try {
                const data = JSON.parse(stored) as OAuthMessage
                handleResult(data)
                return
              } catch (e) {
                // ignore parse error
              }
            }
            // No result from either method
            cleanup()
            reject(new Error('OAuth popup was closed'))
          }, 500)
        }
      } catch (e) {
        // COOP error - can't access popup.closed, rely on localStorage polling
        // Check localStorage more frequently as fallback
        const stored = localStorage.getItem('oauth_result')
        if (stored) {
          clearInterval(checkClosed)
          try {
            const data = JSON.parse(stored) as OAuthMessage
            handleResult(data)
          } catch (parseError) {
            // ignore parse error
          }
        }
      }
    }, 500)
  })
}

export async function connectMeta(): Promise<OAuthResult> {
  try {
    const data = await api.startMetaOAuth()
    if (!data.success || !data.url) throw new Error('Failed to generate OAuth URL')
    return await openOAuthPopup(data.url, 'Connect Meta', 'META_OAUTH_SUCCESS', 'META_OAUTH_ERROR')
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function connectGoogleAds(): Promise<OAuthResult> {
  try {
    const data = await api.startGoogleOAuth()
    if (!data.success || !data.url) throw new Error('Failed to generate OAuth URL')
    return await openOAuthPopup(data.url, 'Connect Google Ads', 'GOOGLE_ADS_OAUTH_SUCCESS', 'GOOGLE_ADS_OAUTH_ERROR')
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function connectGA4(): Promise<OAuthResult> {
  try {
    const data = await api.startGA4OAuth()
    if (!data.success || !data.url) throw new Error('Failed to generate OAuth URL')
    return await openOAuthPopup(data.url, 'Connect GA4', 'GA4_OAUTH_SUCCESS', 'GA4_OAUTH_ERROR')
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export interface OAuthConnectionStatus {
  connected: boolean
  name?: string
  meta_user_id?: string
  user_openid?: string
  expires_at?: string
  is_expired?: boolean
}

export interface OAuthStatusResponse {
  user_id: number
  user_email: string
  oauth_connections: {
    meta: OAuthConnectionStatus
    google_ads: OAuthConnectionStatus
    ga4: OAuthConnectionStatus
  }
}

export async function getOAuthStatus(): Promise<OAuthStatusResponse | null> {
  try {
    return await api.getOAuthStatus()
  } catch (error) {
    console.error('Get OAuth status error:', error)
    return null
  }
}
