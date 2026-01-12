import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Check for OAuth errors
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

  try {
    // Get JWT token from cookie or localStorage
    // Note: We need to pass the token from frontend since this is a server-side route
    // The frontend will handle the OAuth flow and call the backend API directly
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const redirectUri = process.env.META_REDIRECT_URI || `${baseUrl}/api/meta/callback`

    // Since we can't access localStorage here (server-side), we'll redirect to a client-side page
    // that will handle the token exchange
    return NextResponse.redirect(
      `${baseUrl}/agency/meta-callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`
    )
  } catch (error: any) {
    return NextResponse.redirect(
      `${baseUrl}/agency/dashboard?error=${encodeURIComponent(error.message)}`
    )
  }
}