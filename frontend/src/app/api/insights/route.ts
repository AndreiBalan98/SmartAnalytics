import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('account_id')

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id is required' },
        { status: 400 }
      )
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const apiKey = process.env.INTERNAL_API_KEY || 'dev-internal-key-123'

    const response = await fetch(
      `${backendUrl}/internal/meta/insights/?account_id=${accountId}`,
      {
        headers: {
          'X-API-KEY': apiKey,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch insights', message: error.message },
      { status: 500 }
    )
  }
}