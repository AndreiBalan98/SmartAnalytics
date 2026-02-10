'use client'

import { useEffect } from 'react'

export default function OAuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')

    if (!type) return

    const msg: Record<string, string> = { type }
    const userName = params.get('userName')
    const userId = params.get('userId')
    const userOpenId = params.get('userOpenId')
    const error = params.get('error')

    if (userName) msg.userName = userName
    if (userId) msg.userId = userId
    if (userOpenId) msg.userOpenId = userOpenId
    if (error) msg.error = error

    // Try postMessage to opener (works if window.opener is preserved)
    if (window.opener) {
      window.opener.postMessage(msg, '*')
    }

    // Always save to localStorage as fallback (same origin as opener)
    localStorage.setItem('oauth_result', JSON.stringify(msg))

    window.close()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600 dark:text-gray-400">
        Authentication complete. You can close this window.
      </p>
    </div>
  )
}
