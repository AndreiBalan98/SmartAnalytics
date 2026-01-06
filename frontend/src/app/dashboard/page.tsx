'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Metrics {
  spend: number
  impressions: number
  clicks: number
  purchases: number
  revenue: number
  roas: number
}

interface InsightsData {
  account_id: string
  date_range: string
  metrics: Metrics
}

export default function DashboardPage() {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)

  useEffect(() => {
    // Get selected account from localStorage
    const selectedAccount = localStorage.getItem('selected_account_id')
    
    if (!selectedAccount) {
      setError('No account selected. Please go to Settings first.')
      setLoading(false)
      return
    }

    setAccountId(selectedAccount)

    // Fetch insights
    fetch(`/api/insights?account_id=${selectedAccount}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setInsights(data)
        }
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/settings" style={{ color: '#0070f3', textDecoration: 'none' }}>
            Settings
          </Link>
          <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            Home
          </Link>
        </div>
      </div>

      {accountId && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#e7f3ff',
          borderRadius: '4px',
          marginTop: '1rem',
          fontSize: '0.9rem'
        }}>
          📊 Viewing data for: <strong>{accountId}</strong>
        </div>
      )}

      {loading && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>Loading insights...</p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f8d7da',
          borderRadius: '8px',
          marginTop: '2rem',
          color: '#721c24'
        }}>
          <strong>Error:</strong> {error}
          <div style={{ marginTop: '1rem' }}>
            <Link 
              href="/settings"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#721c24',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Go to Settings
            </Link>
          </div>
        </div>
      )}

      {insights && (
        <>
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            marginTop: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <strong>Date Range:</strong> {insights.date_range}
          </div>

          {/* KPI Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {/* Spend */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                💰 Spend
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>
                {formatCurrency(insights.metrics.spend)}
              </div>
            </div>

            {/* Impressions */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                👁️ Impressions
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
                {formatNumber(insights.metrics.impressions)}
              </div>
            </div>

            {/* Clicks */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                🖱️ Clicks
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>
                {formatNumber(insights.metrics.clicks)}
              </div>
            </div>

            {/* Purchases */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                🛒 Purchases
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
                {formatNumber(insights.metrics.purchases)}
              </div>
            </div>

            {/* Revenue */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                💵 Revenue
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a085' }}>
                {formatCurrency(insights.metrics.revenue)}
              </div>
            </div>

            {/* ROAS */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                📈 ROAS
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
                {insights.metrics.roas.toFixed(2)}x
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{
        marginTop: '3rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        color: '#666'
      }}>
        <h3 style={{ marginTop: 0 }}>✅ Milestone 1 Complete!</h3>
        <p>All features working with mock data:</p>
        <ul>
          <li>✅ Backend health check + API key middleware</li>
          <li>✅ Mock Meta endpoints (status, ad-accounts, insights)</li>
          <li>✅ Settings page with account selection</li>
          <li>✅ Dashboard with KPI cards</li>
        </ul>
        <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
          Ready for Milestone 2: Real Meta OAuth integration
        </p>
      </div>
    </div>
  )
}