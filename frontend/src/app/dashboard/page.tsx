'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MetricsSummary {
  total_spend: number
  total_impressions: number
  total_clicks: number
  total_conversions: number
  avg_ctr: number
  avg_cpc: number
  avg_cpm: number
}

interface DailyData {
  date: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
}

interface AccountBreakdown {
  account_id: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  cpm: number
  currency: string
}

interface MetricsData {
  date_range: {
    start_date: string
    end_date: string
  }
  summary: MetricsSummary
  daily_data: DailyData[]
  account_breakdown: AccountBreakdown[]
}

export default function ClientDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()

  // State
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date range state
  const [days, setDays] = useState(30) // Last 30 days by default

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/client/login')
    } else if (!authLoading && user && user.user_type !== 'client') {
      router.push('/')
    } else if (!authLoading && user && user.user_type === 'client') {
      loadMetrics()
    }
  }, [user, authLoading, router])

  async function loadMetrics() {
    setLoading(true)
    setError(null)

    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const data = await api.getClientMetrics(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )

      setMetricsData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  function handleDateRangeChange(newDays: number) {
    setDays(newDays)
    // Reload metrics will be triggered by useEffect
  }

  // Reload metrics when days changes
  useEffect(() => {
    if (user && user.user_type === 'client') {
      loadMetrics()
    }
  }, [days])

  if (authLoading || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || user.user_type !== 'client') {
    return null
  }

  // No permissions case
  if (metricsData && metricsData.daily_data.length === 0 && metricsData.summary.total_spend === 0) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f8f9fa' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Client Dashboard</h1>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h2 style={{ margin: '0 0 1rem 0', color: '#666' }}>No Data Available</h2>
            <p style={{ color: '#999', marginBottom: '0' }}>
              Your agency hasn't assigned any ad accounts to you yet.
              <br />
              Please contact your agency to get access.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Client Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            {user.first_name} {user.last_name}
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Error Message */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee',
            borderRadius: '8px',
            marginBottom: '2rem',
            color: '#c00'
          }}>
            {error}
          </div>
        )}

        {/* Date Range Selector */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', marginRight: '1rem' }}>Date Range:</span>
            <button
              onClick={() => handleDateRangeChange(7)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: days === 7 ? '#0070f3' : 'white',
                color: days === 7 ? 'white' : '#333',
                border: days === 7 ? 'none' : '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: days === 7 ? '600' : '400'
              }}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleDateRangeChange(30)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: days === 30 ? '#0070f3' : 'white',
                color: days === 30 ? 'white' : '#333',
                border: days === 30 ? 'none' : '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: days === 30 ? '600' : '400'
              }}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleDateRangeChange(90)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: days === 90 ? '#0070f3' : 'white',
                color: days === 90 ? 'white' : '#333',
                border: days === 90 ? 'none' : '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: days === 90 ? '600' : '400'
              }}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        {metricsData && (
          <>
            {/* Metrics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <MetricCard
                title="Total Spend"
                value={`$${metricsData.summary.total_spend.toFixed(2)}`}
                icon="💰"
              />
              <MetricCard
                title="Impressions"
                value={metricsData.summary.total_impressions.toLocaleString()}
                icon="👁️"
              />
              <MetricCard
                title="Clicks"
                value={metricsData.summary.total_clicks.toLocaleString()}
                icon="🖱️"
              />
              <MetricCard
                title="Conversions"
                value={metricsData.summary.total_conversions.toLocaleString()}
                icon="🎯"
              />
              <MetricCard
                title="Avg CTR"
                value={`${metricsData.summary.avg_ctr.toFixed(2)}%`}
                icon="📈"
              />
              <MetricCard
                title="Avg CPC"
                value={`$${metricsData.summary.avg_cpc.toFixed(2)}`}
                icon="💵"
              />
              <MetricCard
                title="Avg CPM"
                value={`$${metricsData.summary.avg_cpm.toFixed(2)}`}
                icon="📊"
              />
            </div>

            {/* Charts */}
            {metricsData.daily_data.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Performance Trends</h2>

                {/* Spend Chart */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#666' }}>Spend Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metricsData.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="spend" stroke="#0070f3" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Impressions & Clicks Chart */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#666' }}>Impressions & Clicks</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metricsData.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="impressions" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Conversions Chart */}
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#666' }}>Conversions</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metricsData.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="conversions" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Account Breakdown Table */}
            {metricsData.account_breakdown.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Account Breakdown</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Account ID</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Spend</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Impressions</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Clicks</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Conversions</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>CTR</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>CPC</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>CPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsData.account_breakdown.map((account) => (
                        <tr key={account.account_id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.75rem' }}>{account.account_id}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            ${account.spend.toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {account.impressions.toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {account.clicks.toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {account.conversions.toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {account.ctr.toFixed(2)}%
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            ${account.cpc.toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            ${account.cpm.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>{title}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#333' }}>
        {value}
      </div>
    </div>
  )
}
