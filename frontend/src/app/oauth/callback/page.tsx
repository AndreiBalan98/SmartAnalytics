'use client'

import { useEffect } from 'react'

export default function OAuthCallbackPage() {
  useEffect(() => {
    // This page is opened by the backend OAuth callback
    // The backend returns HTML with postMessage, so this page
    // is only a fallback if the user navigates here directly
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')

    if (error) {
      window.opener?.postMessage({ type: 'OAUTH_ERROR', error }, '*')
      window.close()
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600 dark:text-gray-400">
        Processing authentication... This window will close automatically.
      </p>
    </div>
  )
}
