'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface MetaStatus {
  connected: boolean
  mock: boolean
  account_name?: string
}

interface AdAccount {
  id: string
  name: string
  currency: string
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<MetaStatus | null>(null)
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    setFetchError(null)
    
    const saved = localStorage.getItem('selected_account_id')
    if (saved) {
      setSelectedAccount(saved)
    }

    Promise.all([
      fetch('/api/meta/status').then(r => {
        if (!r.ok) throw new Error('Failed to fetch status')
        return r.json()
      }),
      fetch('/api/ad-accounts').then(r => {
        if (!r.ok) throw new Error('Failed to fetch accounts')
        return r.json()
      })
    ]).then(([statusData, accountsData]) => {
      setStatus(statusData)
      setAccounts(accountsData.data || [])
      setLoading(false)
    }).catch(err => {
      console.error('Load data error:', err)
      setFetchError(err.message || 'Failed to load data from backend')
      setLoading(false)
      // Set a default disconnected status so UI can render
      setStatus({ connected: false, mock: false })
    })
  }

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      setMessage({ type: 'success', text: 'Successfully connected to Meta!' })
      localStorage.removeItem('selected_account_id')
      setSelectedAccount('')
    } else if (error) {
      setMessage({ type: 'error', text: decodeURIComponent(error) })
    }

    loadData()
  }, [searchParams])

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId)
    localStorage.setItem('selected_account_id', accountId)
  }

  const handleConnect = () => {
    setConnecting(true)
    window.location.href = '/api/meta/start'
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Settings</h1>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>

      {message && (
        <div style={{
          padding: '1rem',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          borderRadius: '8px',
          marginTop: '1rem',
          color: message.type === 'success' ? '#155724' : '#721c24'
        }}>
          {message.text}
        </div>
      )}

      {fetchError && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          marginTop: '1rem',
          color: '#856404',
          border: '1px solid #ffc107'
        }}>
          <strong>⚠️ Backend Connection Error:</strong>
          <div style={{ marginTop: '0.5rem' }}>{fetchError}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Make sure Django backend is running on http://localhost:8000
          </div>
          <button
            onClick={loadData}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#856404',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            marginTop: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2>Meta Ads Connection</h2>
            
            {status?.connected ? (
              <div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#d4edda',
                  borderRadius: '4px',
                  color: '#155724',
                  marginTop: '1rem'
                }}>
                  ✅ Connected {status.mock && '(Mock Mode)'}
                  {status.account_name && <div><strong>{status.account_name}</strong></div>}
                </div>
                
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: connecting ? 'not-allowed' : 'pointer',
                    opacity: connecting ? 0.6 : 1
                  }}
                >
                  {connecting ? 'Reconnecting...' : 'Reconnect Meta Account'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f8d7da',
                  borderRadius: '4px',
                  color: '#721c24',
                  marginTop: '1rem'
                }}>
                  ❌ Not Connected
                </div>
                
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#1877f2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: connecting ? 'not-allowed' : 'pointer',
                    opacity: connecting ? 0.6 : 1,
                    fontWeight: 'bold'
                  }}
                >
                  {connecting ? 'Connecting...' : 'Connect Meta Account'}
                </button>
              </div>
            )}
          </div>

          {accounts.length > 0 && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              marginTop: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2>Select Ad Account</h2>
              
              <select
                value={selectedAccount}
                onChange={(e) => handleAccountChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  marginTop: '1rem'
                }}
              >
                <option value="">-- Select an account --</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>

              {selectedAccount && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}>
                  ✓ Account selected: <strong>{selectedAccount}</strong>
                </div>
              )}
            </div>
          )}

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Link 
              href="/dashboard"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: selectedAccount ? '#0070f3' : '#ccc',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                pointerEvents: selectedAccount ? 'auto' : 'none'
              }}
            >
              Go to Dashboard →
            </Link>
            {!selectedAccount && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                Please select an ad account first
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}