/**
 * CenterPanel Component
 * Switches between different data views based on selectedView
 */

'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import CampaignsTable from './CampaignsTable'
import AdSetsTable from './AdSetsTable'
import AdsTable from './AdsTable'
import CreativesGrid from './CreativesGrid'
import InsightsView from './InsightsView'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface CenterPanelProps {
  view: string
  accountId: string | null
  selectedCampaigns: string[]
  onSelectCampaigns: (campaigns: string[]) => void
  selectedAdSets: string[]
  onSelectAdSets: (adSets: string[]) => void
  selectedAds: string[]
  onSelectAds: (ads: string[]) => void
}

export default function CenterPanel({
  view,
  accountId,
  selectedCampaigns,
  onSelectCampaigns,
  selectedAdSets,
  onSelectAdSets,
  selectedAds,
  onSelectAds,
}: CenterPanelProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accountId) {
      setData([])
      return
    }

    loadData()
  }, [view, accountId])

  async function loadData() {
    if (!accountId) return

    setLoading(true)
    setError(null)

    try {
      let result: any

      switch (view) {
        case 'campaigns':
          result = await api.getClientCampaignsNew(accountId)
          setData(result.campaigns || [])
          break

        case 'adsets':
          // For ad sets, we need a campaign ID (for now, get all for account)
          // This is a simplified version - you may want campaign selection
          setData([])
          setError('Select a campaign to view ad sets (feature coming soon)')
          break

        case 'ads':
          // Similar to ad sets
          setData([])
          setError('Select an ad set to view ads (feature coming soon)')
          break

        case 'creatives':
          result = await api.getClientCreativesNew(accountId)
          setData(result.creatives || [])
          break

        case 'insights':
          const endDate = new Date().toISOString().split('T')[0]
          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

          result = await api.getClientInsightsNew({
            account_id: accountId,
            level: 'account',
            start_date: startDate,
            end_date: endDate,
          })
          setData(result.insights || [])
          break

        default:
          setData([])
      }
    } catch (err: any) {
      console.error('Failed to load data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (!accountId) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        color: '#9ca3af',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#6b7280' }}>
            Select an Ad Account
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Choose an ad account from the left panel to view data
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ flex: 1, backgroundColor: 'white' }}>
        <LoadingSpinner message={`Loading ${view}...`} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
      }}>
        <div style={{
          padding: '2rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          maxWidth: '500px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p style={{ margin: 0, color: '#991b1b', fontSize: '0.875rem' }}>
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="scrollbar-hidden" style={{
      height: '100%',
      backgroundColor: 'white',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header - reducere înălțime */}
      <div style={{
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        flexShrink: 0,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#1f2937',
          textTransform: 'capitalize',
        }}>
          {view}
        </h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }} className="scrollbar-hidden">
        {view === 'campaigns' && (
          <CampaignsTable
            campaigns={data}
            loading={loading}
            selectedCampaigns={selectedCampaigns}
            onSelectCampaigns={onSelectCampaigns}
          />
        )}
        {view === 'adsets' && <AdSetsTable adsets={data} loading={loading} />}
        {view === 'ads' && <AdsTable ads={data} loading={loading} />}
        {view === 'creatives' && <CreativesGrid creatives={data} loading={loading} />}
        {view === 'insights' && <InsightsView insights={data} loading={loading} />}
      </div>
    </div>
  )
}
