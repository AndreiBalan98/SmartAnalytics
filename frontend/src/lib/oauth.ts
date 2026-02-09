/**
 * OAuth Helper Functions
 * Gestionează flow-urile OAuth pentru Meta, Google Ads, GA4
 */

import { getValidAccessToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FRONTEND_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// ==================================
// TYPES
// ==================================

export interface OAuthResult {
  success: boolean;
  userName?: string;
  userId?: string;
  userOpenId?: string;
  error?: string;
}

type OAuthMessageType =
  | 'META_OAUTH_SUCCESS'
  | 'META_OAUTH_ERROR'
  | 'GOOGLE_ADS_OAUTH_SUCCESS'
  | 'GOOGLE_ADS_OAUTH_ERROR'
  | 'GA4_OAUTH_SUCCESS'
  | 'GA4_OAUTH_ERROR';

interface OAuthMessage {
  type: OAuthMessageType;
  userName?: string;
  userId?: string;
  userOpenId?: string;
  error?: string;
}

// ==================================
// HELPER FUNCTIONS
// ==================================

/**
 * Deschide un pop-up OAuth și așteaptă rezultatul
 */
async function openOAuthPopup(
  url: string,
  title: string,
  successType: OAuthMessageType,
  errorType: OAuthMessageType
): Promise<OAuthResult> {
  return new Promise((resolve, reject) => {
    // Parametrii pop-up
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no,resizable=yes,scrollbars=yes`;

    // Deschide pop-up
    const popup = window.open(url, title, features);

    if (!popup) {
      reject(new Error('Failed to open OAuth popup. Please allow popups for this site.'));
      return;
    }

    // Listener pentru postMessage
    const messageHandler = (event: MessageEvent<OAuthMessage>) => {
      // Verifică originea pentru securitate
      if (event.origin !== FRONTEND_URL && event.origin !== API_URL) {
        return;
      }

      const { type, userName, userId, userOpenId, error } = event.data;

      // Success
      if (type === successType) {
        window.removeEventListener('message', messageHandler);
        resolve({
          success: true,
          userName,
          userId,
          userOpenId,
        });
        return;
      }

      // Error
      if (type === errorType) {
        window.removeEventListener('message', messageHandler);
        resolve({
          success: false,
          error: error || 'OAuth failed',
        });
        return;
      }
    };

    // Adaugă listener
    window.addEventListener('message', messageHandler);

    // Verifică dacă pop-up-ul s-a închis fără să primim mesaj
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);

        // Dacă pop-up-ul s-a închis și nu am primit niciun mesaj, e posibil ca user-ul să fi anulat
        // Așteaptă 500ms pentru a permite postMessage să ajungă
        setTimeout(() => {
          reject(new Error('OAuth popup was closed'));
        }, 500);
      }
    }, 500);
  });
}

/**
 * Obține user ID din JWT token
 */
function getUserIdFromToken(): string | null {
  try {
    const token = getValidAccessToken();
    if (!token) return null;

    // Decode JWT (partea 2 este payload-ul)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id || payload.sub || null;
  } catch (error) {
    console.error('Failed to get user ID from token:', error);
    return null;
  }
}

// ==================================
// META OAUTH
// ==================================

/**
 * Inițiază flow-ul OAuth pentru Meta
 */
export async function connectMeta(): Promise<OAuthResult> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const userId = getUserIdFromToken();
    if (!userId) {
      throw new Error('Could not get user ID');
    }

    // Obține URL-ul OAuth de la backend
    const response = await fetch(`${API_URL}/api/integrations/oauth/meta/start/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to start OAuth flow');
    }

    const data = await response.json();

    if (!data.success || !data.url) {
      throw new Error(data.error || 'Failed to generate OAuth URL');
    }

    // Adaugă user_id la URL pentru callback
    const oauthUrl = `${data.url}&user_id=${userId}`;

    // Deschide pop-up și așteaptă rezultatul
    const result = await openOAuthPopup(
      oauthUrl,
      'Connect Meta',
      'META_OAUTH_SUCCESS',
      'META_OAUTH_ERROR'
    );

    return result;
  } catch (error) {
    console.error('Meta OAuth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ==================================
// GOOGLE ADS OAUTH
// ==================================

/**
 * Inițiază flow-ul OAuth pentru Google Ads
 */
export async function connectGoogleAds(): Promise<OAuthResult> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const userId = getUserIdFromToken();
    if (!userId) {
      throw new Error('Could not get user ID');
    }

    // Obține URL-ul OAuth de la backend
    const response = await fetch(`${API_URL}/api/integrations/oauth/google-ads/start/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to start OAuth flow');
    }

    const data = await response.json();

    if (!data.success || !data.url) {
      throw new Error(data.error || 'Failed to generate OAuth URL');
    }

    // Adaugă user_id la URL pentru callback
    const oauthUrl = `${data.url}&user_id=${userId}`;

    // Deschide pop-up și așteaptă rezultatul
    const result = await openOAuthPopup(
      oauthUrl,
      'Connect Google Ads',
      'GOOGLE_ADS_OAUTH_SUCCESS',
      'GOOGLE_ADS_OAUTH_ERROR'
    );

    return result;
  } catch (error) {
    console.error('Google Ads OAuth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ==================================
// GA4 OAUTH
// ==================================

/**
 * Inițiază flow-ul OAuth pentru GA4
 */
export async function connectGA4(): Promise<OAuthResult> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const userId = getUserIdFromToken();
    if (!userId) {
      throw new Error('Could not get user ID');
    }

    // Obține URL-ul OAuth de la backend
    const response = await fetch(`${API_URL}/api/integrations/oauth/ga4/start/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to start OAuth flow');
    }

    const data = await response.json();

    if (!data.success || !data.url) {
      throw new Error(data.error || 'Failed to generate OAuth URL');
    }

    // Adaugă user_id la URL pentru callback
    const oauthUrl = `${data.url}&user_id=${userId}`;

    // Deschide pop-up și așteaptă rezultatul
    const result = await openOAuthPopup(
      oauthUrl,
      'Connect GA4',
      'GA4_OAUTH_SUCCESS',
      'GA4_OAUTH_ERROR'
    );

    return result;
  } catch (error) {
    console.error('GA4 OAuth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ==================================
// GET OAUTH STATUS
// ==================================

export interface OAuthConnectionStatus {
  connected: boolean;
  name?: string;
  meta_user_id?: string;
  user_openid?: string;
  expires_at?: string;
  is_expired?: boolean;
}

export interface OAuthStatusResponse {
  user_id: number;
  user_email: string;
  oauth_connections: {
    meta: OAuthConnectionStatus;
    google_ads: OAuthConnectionStatus;
    ga4: OAuthConnectionStatus;
  };
}

/**
 * Obține statusul conexiunilor OAuth pentru utilizatorul curent
 */
export async function getOAuthStatus(): Promise<OAuthStatusResponse | null> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/integrations/oauth/status/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get OAuth status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get OAuth status error:', error);
    return null;
  }
}
