import { NextResponse } from 'next/server'

export async function GET() {
  const metaAppId = process.env.META_APP_ID || ''
  const redirectUri = process.env.META_REDIRECT_URI || ''
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  if (!metaAppId) {
    return NextResponse.json(
      { error: 'META_APP_ID not configured' },
      { status: 500 }
    )
  }

  // Build Meta OAuth URL
  const scopes = ['ads_read', 'business_management']
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?` +
    `client_id=${metaAppId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes.join(',')}` +
    `&response_type=code` +
    `&state=random_state_string`

  return NextResponse.redirect(authUrl)
}