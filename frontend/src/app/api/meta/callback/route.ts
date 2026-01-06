import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Check for OAuth errors
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Unknown error'
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent(errorDescription)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/settings?error=No authorization code received`
    )
  }

  try {
    // Exchange code for token via backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const apiKey = process.env.INTERNAL_API_KEY || 'dev-internal-key-123'
    const redirectUri = process.env.META_REDIRECT_URI || ''

    const response = await fetch(`${backendUrl}/internal/meta/exchange-code/`, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to exchange code')
    }

    // Success - redirect to settings
    return NextResponse.redirect(`${baseUrl}/settings?success=1`)
  } catch (error: any) {
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent(error.message)}`
    )
  }
}