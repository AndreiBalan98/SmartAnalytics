'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock data for development (FAZA 4A)
const MOCK_DAILY_DATA = [
  { date: '2026-01-05', spend: 145.50, impressions: 5420, clicks: 234, conversions: 12, revenue: 580.00 },
  { date: '2026-01-06', spend: 158.20, impressions: 6120, clicks: 267, conversions: 15, revenue: 690.00 },
  { date: '2026-01-07', spend: 142.80, impressions: 5890, clicks: 245, conversions: 11, revenue: 520.00 },
  { date: '2026-01-08', spend: 167.30, impressions: 6540, clicks: 289, conversions: 18, revenue: 820.00 },
  { date: '2026-01-09', spend: 155.90, impressions: 6230, clicks: 271, conversions: 14, revenue: 710.00 },
  { date: '2026-01-10', spend: 172.40, impressions: 6890, clicks: 302, conversions: 19, revenue: 890.00 },
  { date: '2026-01-11', spend: 163.20, impressions: 6450, clicks: 285, conversions: 16, revenue: 760.00 },
]

const MOCK_CAMPAIGNS = [
  { 
    id: 1, 
    name: 'Summer Sale Campaign', 
    spend: 485.30, 
    impressions: 18450, 
    clicks: 823, 
    conversions: 42,
    revenue: 1950.00,
    status: 'active'
  },
  { 
    id: 2, 
    name: 'Brand Awareness Q1', 
    spend: 312.80, 
    impressions: 12340, 
    clicks: 534, 
    conversions: 28,
    revenue: 1240.00,
    status: 'active'
  },
  { 
    id: 3, 
    name: 'Retargeting - Cart Abandoners', 
    spend: 267.20, 
    impressions: 9850, 
    clicks: 456, 
    conversions: 35,
    revenue: 1780.00,
    status: 'active'
  },
]

type DateRange = 'last_7_days' | 'last_30_days' | 'custom'

export default function ClientDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()

  const [dateRange, setDateRange] = useState<DateRange>('last_7_days')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/client/login')
    } else if (!authLoading && user && user.user_type !== 'client') {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Calculate totals from mock data
  const totals = MOCK_DAILY_DATA.reduce((acc, day) => ({
    spend: acc.spend + day.spend,
    impressions: acc.impressions + day.impressions,
    clicks: acc.clicks + day.clicks,
    conversions: acc.conversions + day.conversions,
    revenue: acc.revenue + day.revenue,
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 })

  // Calculate derived metrics
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  if (authLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || user.user_type !== 'client') {
    return null
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
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Welcome back, {user.first_name || user.email}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

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
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Mock Data Notice */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #ffc107'
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#856404' }}>
            📊 <strong>Mock Data:</strong> Currently showing sample data. Real data from your ad accounts will be available in FAZA 5 (Background Workers).
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Total Spend */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>TOTAL SPEND</span>
              <span style={{ fontSize: '1.5rem' }}>💰</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>
              {formatCurrency(totals.spend)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
              Last 7 days
            </div>
          </div>

          {/* Total Impressions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>IMPRESSIONS</span>
              <span style={{ fontSize: '1.5rem' }}>👁️</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
              {formatNumber(totals.impressions)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
              Last 7 days
            </div>
          </div>

          {/* Total Clicks */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>CLICKS</span>
              <span style={{ fontSize: '1.5rem' }}>🖱️</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9b59b6' }}>
              {formatNumber(totals.clicks)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
              Last 7 days
            </div>
          </div>

          {/* Total Conversions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>CONVERSIONS</span>
              <span style={{ fontSize: '1.5rem' }}>🎯</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
              {formatNumber(totals.conversions)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
              Last 7 days
            </div>
          </div>
        </div>

        {/* Performance Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* CTR */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>CTR</span>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a085' }}>
              {formatPercent(ctr)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
              Click-Through Rate
            </div>
          </div>

          {/* CPC */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>CPC</span>
              <span style={{ fontSize: '1.5rem' }}>💵</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e67e22' }}>
              {formatCurrency(cpc)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
              Cost Per Click
            </div>
          </div>

          {/* ROAS */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>ROAS</span>
              <span style={{ fontSize: '1.5rem' }}>📈</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
              {roas.toFixed(2)}x
            </div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
              Return on Ad Spend
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* Spend Trend Chart */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
              Spend Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MOCK_DAILY_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(String(value)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value) || 0)}
                  labelFormatter={(label) => new Date(String(label)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="#e74c3c" 
                  strokeWidth={2}
                  name="Spend"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Clicks & Impressions Trend Chart */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
              Engagement Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MOCK_DAILY_DATA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => {
                    const numValue = Number(value) || 0
                    if (name === 'Clicks' || name === 'Conversions') {
                      return formatNumber(numValue)
                    }
                    return formatNumber(numValue)
                  }}
                  labelFormatter={(label) => new Date(String(label)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#9b59b6" 
                  strokeWidth={2}
                  name="Clicks"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#27ae60" 
                  strokeWidth={2}
                  name="Conversions"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaigns Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
            Campaigns Performance
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem' }}>Campaign</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>Spend</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>Impressions</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>Clicks</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>Conversions</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>Revenue</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem' }}>ROAS</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CAMPAIGNS.map((campaign) => {
                  const campaignRoas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0
                  return (
                    <tr key={campaign.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>{campaign.name}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(campaign.spend)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatNumber(campaign.impressions)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatNumber(campaign.clicks)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatNumber(campaign.conversions)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(campaign.revenue)}</td>
                      <td style={{ 
                        padding: '0.75rem', 
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: campaignRoas >= 3 ? '#27ae60' : campaignRoas >= 2 ? '#f39c12' : '#e74c3c'
                      }}>
                        {campaignRoas.toFixed(2)}x
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: campaign.status === 'active' ? '#d4edda' : '#f8d7da',
                          color: campaign.status === 'active' ? '#155724' : '#721c24',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #ddd', fontWeight: 'bold' }}>
                  <td style={{ padding: '0.75rem' }}>TOTAL</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {formatCurrency(MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.spend, 0))}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {formatNumber(MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.impressions, 0))}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {formatNumber(MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.clicks, 0))}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {formatNumber(MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.conversions, 0))}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {formatCurrency(MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.revenue, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}