import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Check for OAuth errors from Google
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Unknown error'
    return NextResponse.redirect(
      `${baseUrl}/agency/dashboard?error=${encodeURIComponent(errorDescription)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/agency/dashboard?error=No authorization code received`
    )
  }

  const redirectUri = `${baseUrl}/api/google-ads/callback`

  // Redirect to client-side page that has access to localStorage (JWT token)
  return NextResponse.redirect(
    `${baseUrl}/agency/google-ads-callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`
  )
}
