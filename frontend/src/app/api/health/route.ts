import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const apiKey = process.env.INTERNAL_API_KEY || 'dev-internal-key-123'

    const response = await fetch(`${backendUrl}/health/`, {
      headers: {
        'X-API-KEY': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to connect to backend', message: error.message },
      { status: 500 }
    )
  }
}