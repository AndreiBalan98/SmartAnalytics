/**
 * Client Dashboard - NEW 3-Panel Layout
 * Left: Ad Accounts | Center: Data Display | Right: Navigation
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LeftPanel from '@/components/dashboard/LeftPanel'
import CenterPanel from '@/components/dashboard/CenterPanel'
import RightPanel from '@/components/dashboard/RightPanel'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface AdAccount {
  id: string
  name: string
  currency: string
  account_status: number
  status_display: string
}

export default function ClientDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()

  // State
  const [selectedPlatform] = useState('meta') // Only Meta for now
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState('campaigns')
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/client/login')
    } else if (!authLoading && user && user.user_type !== 'client') {
      router.push('/')
    } else if (!authLoading && user && user.user_type === 'client') {
      loadAdAccounts()
    }
  }, [user, authLoading, router])

  async function loadAdAccounts() {
    setLoading(true)
    setError(null)

    try {
      const response = await api.getClientAdAccountsNew()
      setAdAccounts(response.ad_accounts || [])

      // Auto-select first account
      if (response.ad_accounts && response.ad_accounts.length > 0) {
        setSelectedAccount(response.ad_accounts[0].id)
      }
    } catch (err: any) {
      console.error('Failed to load ad accounts:', err)
      setError(err.message || 'Failed to load ad accounts')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    )
  }

  if (!user || user.user_type !== 'client') {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937',
            }}>
              Dashboard
            </h1>
            <p style={{
              margin: '0.25rem 0 0 0',
              fontSize: '0.875rem',
              color: '#6b7280',
            }}>
              {user.first_name} {user.last_name} • {user.email}
            </p>
          </div>

          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Platform Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem',
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          gap: '1rem',
        }}>
          <button
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: selectedPlatform === 'meta' ? '#3b82f6' : 'transparent',
              color: selectedPlatform === 'meta' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedPlatform === 'meta' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Meta Ads
          </button>
          <button
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#d1d5db',
              border: 'none',
              borderBottom: '3px solid transparent',
              cursor: 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
            disabled
          >
            Google Ads <span style={{ fontSize: '0.75rem' }}>(Soon)</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          maxWidth: '1600px',
          margin: '1rem auto',
          padding: '0 2rem',
          width: '100%',
        }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        </div>
      )}

      {/* 3-Panel Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        maxWidth: '1600px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginTop: '1rem',
        marginBottom: '1rem',
        marginLeft: '2rem',
        marginRight: '2rem',
      }}>
        {/* Left Panel - Ad Accounts */}
        <LeftPanel
          accounts={adAccounts}
          selectedAccount={selectedAccount}
          onSelectAccount={setSelectedAccount}
          loading={loading}
        />

        {/* Center Panel - Data Display */}
        <CenterPanel
          view={selectedView}
          accountId={selectedAccount}
        />

        {/* Right Panel - Navigation */}
        <RightPanel
          selectedView={selectedView}
          onSelectView={setSelectedView}
          disabled={!selectedAccount}
        />
      </div>
    </div>
  )
}
