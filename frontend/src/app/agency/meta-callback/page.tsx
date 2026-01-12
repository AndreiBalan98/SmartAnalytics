'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

function MetaCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const redirectUri = searchParams.get('redirect_uri')

    if (!code || !redirectUri) {
      setStatus('error')
      setMessage('Missing authorization code or redirect URI')
      setTimeout(() => router.push('/agency/dashboard'), 3000)
      return
    }

    exchangeCode(code, redirectUri)
  }, [searchParams, router])

  async function exchangeCode(code: string, redirectUri: string) {
    try {
      setStatus('processing')
      setMessage('Connecting to Meta...')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/meta/exchange-code/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).access : ''}`,
          },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to connect Meta')
      }

      const data = await response.json()
      
      setStatus('success')
      setMessage(`Successfully connected to Meta! ${data.business_name ? `Business: ${data.business_name}` : ''}`)
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/agency/dashboard?meta_connected=true')
      }, 2000)
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Failed to connect Meta')
      
      setTimeout(() => {
        router.push(`/agency/dashboard?error=${encodeURIComponent(error.message)}`)
      }, 3000)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #0070f3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
              Connecting to Meta
            </h2>
            <p style={{ margin: 0, color: '#666' }}>
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>
              ✅
            </div>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#27ae60' }}>
              Success!
            </h2>
            <p style={{ margin: 0, color: '#666' }}>
              {message}
            </p>
            <p style={{ margin: '1rem 0 0 0', fontSize: '0.875rem', color: '#999' }}>
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem'
            }}>
              ❌
            </div>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#e74c3c' }}>
              Connection Failed
            </h2>
            <p style={{ margin: 0, color: '#666' }}>
              {message}
            </p>
            <p style={{ margin: '1rem 0 0 0', fontSize: '0.875rem', color: '#999' }}>
              Redirecting to dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function MetaCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <p>Loading...</p>
      </div>
    }>
      <MetaCallbackContent />
    </Suspense>
  )
}