/**
 * GA4InsightsView Component
 * Displays GA4 analytics data: sessions, users, pageviews, bounce rate, conversions, etc.
 */

'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface GA4InsightsViewProps {
  propertyId: string | null
}

export default function GA4InsightsView({ propertyId }: GA4InsightsViewProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (propertyId && startDate && endDate) {
      loadData()
    }
  }, [propertyId, startDate, endDate])

  async function loadData() {
    if (!propertyId) return

    setLoading(true)
    setError(null)

    try {
      const result = await api.getClientGA4Insights({
        property_id: propertyId,
        start_date: startDate,
        end_date: endDate,
        include_sources: 'true',
      })
      setData(result)
    } catch (err: any) {
      console.error('Failed to load GA4 insights:', err)
      setError(err.message || 'Failed to load GA4 insights')
    } finally {
      setLoading(false)
    }
  }

  if (!propertyId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Select a property to view analytics
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner message="Loading GA4 analytics..." />
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          display: 'inline-block',
        }}>
          <p style={{ margin: 0, color: '#991b1b', fontSize: '0.875rem' }}>{error}</p>
        </div>
      </div>
    )
  }

  const insights = data?.insights || []
  const sources = data?.sources || []

  // Aggregate totals from daily data
  const totals = insights.reduce((acc: any, day: any) => ({
    sessions: (acc.sessions || 0) + (day.sessions || 0),
    users: (acc.users || 0) + (day.users || 0),
    pageviews: (acc.pageviews || 0) + (day.pageviews || 0),
    conversions: (acc.conversions || 0) + (day.conversions || 0),
    events: (acc.events || 0) + (day.events || 0),
    revenue: (acc.revenue || 0) + parseFloat(day.revenue || 0),
    bounce_rate_sum: (acc.bounce_rate_sum || 0) + (day.bounce_rate || 0),
    count: (acc.count || 0) + 1,
  }), {})

  const avgBounceRate = totals.count > 0 ? (totals.bounce_rate_sum / totals.count) : 0

  const metricCards = [
    { label: 'Sessions', value: (totals.sessions || 0).toLocaleString(), color: '#3b82f6' },
    { label: 'Users', value: (totals.users || 0).toLocaleString(), color: '#8b5cf6' },
    { label: 'Pageviews', value: (totals.pageviews || 0).toLocaleString(), color: '#10b981' },
    { label: 'Bounce Rate', value: `${avgBounceRate.toFixed(1)}%`, color: '#f59e0b' },
    { label: 'Conversions', value: (totals.conversions || 0).toLocaleString(), color: '#ef4444' },
    { label: 'Revenue', value: `$${(totals.revenue || 0).toFixed(2)}`, color: '#06b6d4' },
  ]

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Date Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: 'center',
      }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {metricCards.map((metric) => (
          <div key={metric.label} style={{
            padding: '1.25rem',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            borderLeft: `4px solid ${metric.color}`,
          }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              {metric.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1f2937' }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Traffic Sources */}
      {sources.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
              Traffic Sources
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Source / Medium</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Sessions</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Users</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Conversions</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source: any, i: number) => (
                  <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>
                      {source.source || '(direct)'} / {source.medium || '(none)'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>
                      {(source.sessions || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>
                      {(source.users || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>
                      {(source.conversions || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>
                      ${parseFloat(source.revenue || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Data Table */}
      {insights.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
          marginTop: '1.5rem',
        }}>
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
              Daily Breakdown
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Sessions</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Users</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Pageviews</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Bounce Rate</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Conversions</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((day: any, i: number) => (
                  <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>{day.date}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{(day.sessions || 0).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{(day.users || 0).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{(day.pageviews || 0).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{(day.bounce_rate || 0).toFixed(1)}%</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{(day.conversions || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {insights.length === 0 && !loading && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#9ca3af',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            No analytics data available for this period. Try syncing GA4 data first.
          </p>
        </div>
      )}
    </div>
  )
}
