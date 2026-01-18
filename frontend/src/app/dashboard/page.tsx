'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { formatCurrency, getCurrencySymbol } from '@/lib/currency'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import DarkModeToggle from '@/components/DarkModeToggle'
import ClientDashboardSkeleton from '@/components/ClientDashboardSkeleton'

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
  account_name: string
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
  const { user, loading: authLoading, logout, darkMode } = useAuth()

  // State
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null)
  const [adAccountsData, setAdAccountsData] = useState<any>(null)
  const [campaignsCount, setCampaignsCount] = useState(0)
  const [adSetsCount, setAdSetsCount] = useState(0)
  const [adsCount, setAdsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dateRangeLoading, setDateRangeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState('USD')

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

  async function loadMetrics(isDateRangeChange: boolean = false) {
    if (isDateRangeChange) {
      setDateRangeLoading(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Load all data in parallel
      const [metricsResponse, adAccountsResponse, campaignsResponse, adSetsResponse, adsResponse] = await Promise.all([
        api.getClientMetrics(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        api.getClientAdAccounts(),
        api.getClientCampaigns(),
        api.getClientAdSets(),
        api.getClientAds(),
      ])

      setMetricsData(metricsResponse)
      setAdAccountsData(adAccountsResponse)
      setCampaignsCount(campaignsResponse.campaigns?.length || 0)
      setAdSetsCount(adSetsResponse.ad_sets?.length || 0)
      setAdsCount(adsResponse.ads?.length || 0)

      // Detect currency from first account or use default
      if (metricsResponse?.account_breakdown && metricsResponse.account_breakdown.length > 0) {
        setCurrency(metricsResponse.account_breakdown[0].currency || 'USD')
      } else if (adAccountsResponse?.ad_accounts && adAccountsResponse.ad_accounts.length > 0) {
        setCurrency(adAccountsResponse.ad_accounts[0].currency || 'USD')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      if (isDateRangeChange) {
        setDateRangeLoading(false)
      } else {
        setLoading(false)
      }
    }
  }

  function handleDateRangeChange(newDays: number) {
    setDays(newDays)
    // Reload metrics will be triggered by useEffect
  }

  // Reload metrics when days changes
  useEffect(() => {
    if (user && user.user_type === 'client') {
      // Determine if this is a date range change (not the initial load)
      const isDateRangeChange = !loading
      loadMetrics(isDateRangeChange)
    }
  }, [days])

  if (authLoading || loading) {
    return <ClientDashboardSkeleton darkMode={darkMode} />
  }

  if (!user || user.user_type !== 'client') {
    return null
  }

  // Show skeleton during date range loading
  if (dateRangeLoading) {
    return <ClientDashboardSkeleton darkMode={darkMode} />
  }

  // No permissions case
  if (metricsData && metricsData.daily_data.length === 0 && metricsData.summary.total_spend === 0) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: darkMode ? '#1a1a1a' : '#f8f9fa' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: darkMode ? '#f3f4f6' : '#000' }}>Client Dashboard</h1>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <DarkModeToggle />
              <button
                onClick={logout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: darkMode ? '#3f3f46' : '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>

          <div style={{
            backgroundColor: darkMode ? '#27272a' : 'white',
            borderRadius: '8px',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h2 style={{ margin: '0 0 1rem 0', color: darkMode ? '#9ca3af' : '#666' }}>No Data Available</h2>
            <p style={{ color: darkMode ? '#71717a' : '#999', marginBottom: '0' }}>
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
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: darkMode ? '#1a1a1a' : '#f8f9fa' }}>
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
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: darkMode ? '#f3f4f6' : '#000' }}>Client Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: darkMode ? '#9ca3af' : '#666' }}>
            {user.first_name} {user.last_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <DarkModeToggle />
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: darkMode ? '#3f3f46' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Error Message */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: darkMode ? '#3f1515' : '#fee',
            borderRadius: '8px',
            marginBottom: '2rem',
            color: darkMode ? '#fca5a5' : '#c00'
          }}>
            {error}
          </div>
        )}

        {/* Ad Accounts & Stats Overview */}
        {adAccountsData && adAccountsData.ad_accounts && adAccountsData.ad_accounts.length > 0 && (
          <div style={{
            backgroundColor: darkMode ? '#27272a' : 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: darkMode ? '#f3f4f6' : '#000' }}>Your Ad Accounts</h2>

            {/* Ad Accounts Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {adAccountsData.ad_accounts.map((account: any) => (
                <div key={account.account_id} style={{
                  padding: '1rem',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: darkMode ? '#1a1a1a' : '#f8f9fa'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: darkMode ? '#f3f4f6' : '#000', marginBottom: '0.25rem' }}>
                    {account.account_name || account.account_id}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: darkMode ? '#9ca3af' : '#666', marginBottom: '0.5rem' }}>
                    {account.account_id}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0070f3' }}>
                    {account.currency}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: darkMode ? '#9ca3af' : '#666', marginTop: '0.5rem' }}>
                    {account.campaigns_count} {account.campaigns_count === 1 ? 'campaign' : 'campaigns'}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div style={{
              display: 'flex',
              gap: '2rem',
              padding: '1rem',
              backgroundColor: darkMode ? '#1e3a5f' : '#f0f7ff',
              borderRadius: '6px',
              flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: darkMode ? '#9ca3af' : '#666', marginBottom: '0.25rem' }}>Total Campaigns</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0070f3' }}>
                  {campaignsCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: darkMode ? '#9ca3af' : '#666', marginBottom: '0.25rem' }}>Total Ad Sets</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0070f3' }}>
                  {adSetsCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: darkMode ? '#9ca3af' : '#666', marginBottom: '0.25rem' }}>Total Ads</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0070f3' }}>
                  {adsCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Range Selector */}
        <div style={{
          backgroundColor: darkMode ? '#27272a' : 'white',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', marginRight: '1rem', color: darkMode ? '#f3f4f6' : '#000' }}>Date Range:</span>
            <button
              onClick={() => handleDateRangeChange(7)}
              disabled={dateRangeLoading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: days === 7 ? '#0070f3' : (darkMode ? '#3f3f46' : 'white'),
                color: days === 7 ? 'white' : (darkMode ? '#f3f4f6' : '#333'),
                border: days === 7 ? 'none' : (darkMode ? '1px solid #3f3f46' : '1px solid #ddd'),
                borderRadius: '6px',
                cursor: dateRangeLoading ? 'not-allowed' : 'pointer',
                fontWeight: days === 7 ? '600' : '400',
                opacity: dateRangeLoading ? 0.6 : 1
              }}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleDateRangeChange(30)}
              disabled={dateRangeLoading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: days === 30 ? '#0070f3' : (darkMode ? '#3f3f46' : 'white'),
                color: days === 30 ? 'white' : (darkMode ? '#f3f4f6' : '#333'),
                border: days === 30 ? 'none' : (darkMode ? '1px solid #3f3f46' : '1px solid #ddd'),
                borderRadius: '6px',
                cursor: dateRangeLoading ? 'not-allowed' : 'pointer',
                fontWeight: days === 30 ? '600' : '400',
                opacity: dateRangeLoading ? 0.6 : 1
              }}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleDateRangeChange(90)}
              disabled={dateRangeLoading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: days === 90 ? '#0070f3' : (darkMode ? '#3f3f46' : 'white'),
                color: days === 90 ? 'white' : (darkMode ? '#f3f4f6' : '#333'),
                border: days === 90 ? 'none' : (darkMode ? '1px solid #3f3f46' : '1px solid #ddd'),
                borderRadius: '6px',
                cursor: dateRangeLoading ? 'not-allowed' : 'pointer',
                fontWeight: days === 90 ? '600' : '400',
                opacity: dateRangeLoading ? 0.6 : 1
              }}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        {metricsData && (
          <>
            {/* Metrics Cards - Row 1: Main Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <MetricCard
                title="Total Spend"
                value={formatCurrency(metricsData.summary.total_spend, currency, 2)}
                icon="💰"
                darkMode={darkMode}
              />
              <MetricCard
                title="Impressions"
                value={metricsData.summary.total_impressions.toLocaleString()}
                icon="👁️"
                darkMode={darkMode}
              />
              <MetricCard
                title="Clicks"
                value={metricsData.summary.total_clicks.toLocaleString()}
                icon="🖱️"
                darkMode={darkMode}
              />
              <MetricCard
                title="Conversions"
                value={metricsData.summary.total_conversions.toLocaleString()}
                icon="🎯"
                darkMode={darkMode}
              />
            </div>

            {/* Metrics Cards - Row 2: Averages */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <MetricCard
                title="Avg CTR"
                value={`${metricsData.summary.avg_ctr.toFixed(2)}%`}
                icon="📈"
                darkMode={darkMode}
              />
              <MetricCard
                title="Avg CPC"
                value={formatCurrency(metricsData.summary.avg_cpc, currency, 2)}
                icon="💵"
                darkMode={darkMode}
              />
              <MetricCard
                title="Avg CPM"
                value={formatCurrency(metricsData.summary.avg_cpm, currency, 2)}
                icon="📊"
                darkMode={darkMode}
              />
            </div>

            {/* Charts */}
            {metricsData.daily_data.length > 0 && (
              <div style={{
                backgroundColor: darkMode ? '#27272a' : 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: darkMode ? '#f3f4f6' : '#000' }}>Performance Trends</h2>

                {/* Spend Chart */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: darkMode ? '#9ca3af' : '#666' }}>Spend Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metricsData.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3f3f46' : '#e5e7eb'} />
                      <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#666'} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#666'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#27272a' : 'white',
                          border: darkMode ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                          color: darkMode ? '#f3f4f6' : '#000'
                        }}
                        formatter={(value: any) => formatCurrency(Number(value), currency, 2)}
                      />
                      <Legend wrapperStyle={{ color: darkMode ? '#f3f4f6' : '#000' }} />
                      <Line type="monotone" dataKey="spend" stroke="#0070f3" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Impressions & Clicks Chart */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: darkMode ? '#9ca3af' : '#666' }}>Impressions & Clicks</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metricsData.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3f3f46' : '#e5e7eb'} />
                      <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#666'} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#666'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#27272a' : 'white',
                          border: darkMode ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                          color: darkMode ? '#f3f4f6' : '#000'
                        }}
                      />
                      <Legend wrapperStyle={{ color: darkMode ? '#f3f4f6' : '#000' }} />
                      <Line type="monotone" dataKey="impressions" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Conversions Chart */}
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: darkMode ? '#9ca3af' : '#666' }}>Conversions</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metricsData.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#3f3f46' : '#e5e7eb'} />
                      <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#666'} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#666'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#27272a' : 'white',
                          border: darkMode ? '1px solid #3f3f46' : '1px solid #e5e7eb',
                          color: darkMode ? '#f3f4f6' : '#000'
                        }}
                      />
                      <Legend wrapperStyle={{ color: darkMode ? '#f3f4f6' : '#000' }} />
                      <Line type="monotone" dataKey="conversions" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Account Breakdown Table */}
            {metricsData.account_breakdown.length > 0 && (
              <div style={{
                backgroundColor: darkMode ? '#27272a' : 'white',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: darkMode ? '#f3f4f6' : '#000' }}>Account Breakdown</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: darkMode ? '2px solid #3f3f46' : '2px solid #ddd' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', color: darkMode ? '#f3f4f6' : '#000' }}>Account Name</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>Spend</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>Impressions</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>Clicks</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>Conversions</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>CTR</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>CPC</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>CPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsData.account_breakdown.map((account) => (
                        <tr key={account.account_id} style={{ borderBottom: darkMode ? '1px solid #3f3f46' : '1px solid #eee' }}>
                          <td style={{ padding: '0.75rem', color: darkMode ? '#f3f4f6' : '#000' }}>
                            <div style={{ fontWeight: '600' }}>{account.account_name || account.account_id}</div>
                            <div style={{ fontSize: '0.75rem', color: darkMode ? '#9ca3af' : '#666' }}>{account.account_id}</div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>
                            {formatCurrency(account.spend, account.currency, 2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>
                            {account.impressions.toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>
                            {account.clicks.toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>
                            {account.conversions.toLocaleString()}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>
                            {account.ctr.toFixed(2)}%
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>
                            {formatCurrency(account.cpc, account.currency, 2)}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: darkMode ? '#f3f4f6' : '#000' }}>
                            {formatCurrency(account.cpm, account.currency, 2)}
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
function MetricCard({ title, value, icon, darkMode }: { title: string; value: string; icon: string; darkMode?: boolean }) {
  return (
    <div style={{
      backgroundColor: darkMode ? '#27272a' : 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <span style={{ fontSize: '0.875rem', color: darkMode ? '#9ca3af' : '#666', fontWeight: '600' }}>{title}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: darkMode ? '#f3f4f6' : '#333' }}>
        {value}
      </div>
    </div>
  )
}
