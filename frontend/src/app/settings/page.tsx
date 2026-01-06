'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  const [status, setStatus] = useState<MetaStatus | null>(null)
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load saved account from localStorage
    const saved = localStorage.getItem('selected_account_id')
    if (saved) {
      setSelectedAccount(saved)
    }

    // Fetch status and accounts
    Promise.all([
      fetch('/api/meta/status').then(r => r.json()),
      fetch('/api/ad-accounts').then(r => r.json())
    ]).then(([statusData, accountsData]) => {
      setStatus(statusData)
      setAccounts(accountsData.data || [])
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId)
    localStorage.setItem('selected_account_id', accountId)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Settings</h1>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Meta Connection Status */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            marginTop: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2>Meta Ads Connection</h2>
            
            {status?.connected ? (
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
            ) : (
              <div style={{
                padding: '1rem',
                backgroundColor: '#f8d7da',
                borderRadius: '4px',
                color: '#721c24',
                marginTop: '1rem'
              }}>
                ❌ Not Connected
              </div>
            )}
          </div>

          {/* Ad Account Selection */}
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

          {/* Navigation */}
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