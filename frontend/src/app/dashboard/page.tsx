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
      router.push('/login')
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
      height: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* PARTEA 1: Header - 10% înălțime cu min/max */}
      <header style={{
        height: 'clamp(60px, 10vh, 80px)',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1f2937',
            }}>
              Dashboard
            </h1>
            <p style={{
              margin: '0.25rem 0 0 0',
              fontSize: '0.75rem',
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

      {/* PARTEA 2: Platform Tabs - 5% înălțime cu min/max */}
      <div style={{
        height: 'clamp(40px, 5vh, 60px)',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          height: '100%',
          alignItems: 'center',
        }}>
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedPlatform === 'meta' ? '#3b82f6' : 'transparent',
              color: selectedPlatform === 'meta' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedPlatform === 'meta' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              height: '100%',
            }}
          >
            Meta Ads
          </button>
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#d1d5db',
              border: 'none',
              borderBottom: '2px solid transparent',
              cursor: 'not-allowed',
              fontSize: '0.8125rem',
              fontWeight: 600,
              height: '100%',
            }}
            disabled
          >
            Google Ads <span style={{ fontSize: '0.7rem' }}>(Soon)</span>
          </button>
        </div>
      </div>

      {/* Error Message (if any) */}
      {error && (
        <div style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {/* PARTEA 3: Trei Panele - 85% (restul înălțimii) */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Left Panel - 12.5% cu min 220px, max 300px */}
        <div style={{
          width: '12.5%',
          minWidth: '220px',
          maxWidth: '300px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
        }}>
          <LeftPanel
            accounts={adAccounts}
            selectedAccount={selectedAccount}
            onSelectAccount={setSelectedAccount}
            loading={loading}
          />
        </div>

        {/* Center Panel - 75% (flex: 1 ia spațiul rămas) */}
        <div style={{
          flex: 1,
          backgroundColor: '#f9fafb',
        }}>
          <CenterPanel
            view={selectedView}
            accountId={selectedAccount}
          />
        </div>

        {/* Right Panel - 12.5% cu min 200px, max 280px */}
        <div style={{
          width: '12.5%',
          minWidth: '200px',
          maxWidth: '280px',
          backgroundColor: 'white',
          borderLeft: '1px solid #e5e7eb',
        }}>
          <RightPanel
            selectedView={selectedView}
            onSelectView={setSelectedView}
            disabled={!selectedAccount}
          />
        </div>
      </div>
    </div>
  )
}
