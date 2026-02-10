/**
 * GoogleAdsInsightsView Component
 * Displays Google Ads performance metrics: spend, impressions, clicks, CPC, CPM, CTR, conversions
 */

'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface SelectionItem {
  id: string
  name: string
  ad_account_id: string
}

interface GoogleAdsInsightsViewProps {
  accountId: string | null
  selectedCampaigns: SelectionItem[]
  selectedAdSets: SelectionItem[]
  selectedAds: SelectionItem[]
}

export default function GoogleAdsInsightsView({
  accountId,
  selectedCampaigns,
  selectedAdSets,
  selectedAds,
}: GoogleAdsInsightsViewProps) {
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
    if (accountId && startDate && endDate) {
      loadData()
    }
  }, [accountId, startDate, endDate])

  async function loadData() {
    if (!accountId) return

    setLoading(true)
    setError(null)

    try {
      // Build entities from selections or use account-level
      const entities: Array<{ id: string; name: string; type: string; start_date: string; end_date: string }> = []

      const adsForAccount = selectedAds.filter(a => a.ad_account_id === accountId)
      const adGroupsForAccount = selectedAdSets.filter(a => a.ad_account_id === accountId)
      const campaignsForAccount = selectedCampaigns.filter(c => c.ad_account_id === accountId)

      if (adsForAccount.length > 0) {
        adsForAccount.forEach(ad => entities.push({
          id: ad.id, name: ad.name, type: 'ad', start_date: startDate, end_date: endDate,
        }))
      } else if (adGroupsForAccount.length > 0) {
        adGroupsForAccount.forEach(ag => entities.push({
          id: ag.id, name: ag.name, type: 'ad_group', start_date: startDate, end_date: endDate,
        }))
      } else if (campaignsForAccount.length > 0) {
        campaignsForAccount.forEach(c => entities.push({
          id: c.id, name: c.name, type: 'campaign', start_date: startDate, end_date: endDate,
        }))
      } else {
        entities.push({
          id: accountId, name: 'Account', type: 'account', start_date: startDate, end_date: endDate,
        })
      }

      const result = await api.getClientGoogleAdsInsightsAggregate({
        entities,
        start_date: startDate,
        end_date: endDate,
      })
      setData(result)
    } catch (err: any) {
      console.error('Failed to load Google Ads insights:', err)
      setError(err.message || 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  if (!accountId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Select an account to view insights
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner message="Loading Google Ads insights..." />
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

  // Aggregate totals
  const totals = insights.reduce((acc: any, row: any) => ({
    spend: (acc.spend || 0) + parseFloat(row.spend || 0),
    impressions: (acc.impressions || 0) + (row.impressions || 0),
    clicks: (acc.clicks || 0) + (row.clicks || 0),
    conversions: (acc.conversions || 0) + parseFloat(row.conversions || 0),
    conversion_value: (acc.conversion_value || 0) + parseFloat(row.conversion_value || 0),
  }), {})

  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100) : 0
  const cpc = totals.clicks > 0 ? (totals.spend / totals.clicks) : 0
  const cpm = totals.impressions > 0 ? ((totals.spend / totals.impressions) * 1000) : 0

  const metricCards = [
    { label: 'Spend', value: `$${(totals.spend || 0).toFixed(2)}`, color: '#3b82f6' },
    { label: 'Impressions', value: (totals.impressions || 0).toLocaleString(), color: '#8b5cf6' },
    { label: 'Clicks', value: (totals.clicks || 0).toLocaleString(), color: '#10b981' },
    { label: 'CTR', value: `${ctr.toFixed(2)}%`, color: '#f59e0b' },
    { label: 'CPC', value: `$${cpc.toFixed(2)}`, color: '#ef4444' },
    { label: 'Conversions', value: (totals.conversions || 0).toFixed(0), color: '#06b6d4' },
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

      {/* Daily Data Table */}
      {insights.length > 0 && (
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
              Daily Breakdown
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Spend</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Impressions</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Clicks</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>CTR</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>CPC</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>Conversions</th>
                </tr>
              </thead>
              <tbody>
                {insights.map((row: any, i: number) => {
                  const rowCtr = row.impressions > 0 ? ((row.clicks / row.impressions) * 100) : 0
                  const rowCpc = row.clicks > 0 ? (parseFloat(row.spend) / row.clicks) : 0
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>{row.date}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>${parseFloat(row.spend || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{(row.impressions || 0).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{(row.clicks || 0).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{rowCtr.toFixed(2)}%</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>${rowCpc.toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{parseFloat(row.conversions || 0).toFixed(0)}</td>
                    </tr>
                  )
                })}
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            No insights data available for this period. Try syncing Google Ads data first.
          </p>
        </div>
      )}
    </div>
  )
}
