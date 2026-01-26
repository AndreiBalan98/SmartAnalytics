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

interface SelectionItem {
  id: string
  name: string
  ad_account_id: string
}

interface CenterPanelProps {
  view: string
  accountId: string | null
  selectedCampaigns: SelectionItem[]
  onSelectCampaigns: (campaigns: SelectionItem[]) => void
  selectedAdSets: SelectionItem[]
  onSelectAdSets: (adSets: SelectionItem[]) => void
  selectedAds: SelectionItem[]
  onSelectAds: (ads: SelectionItem[]) => void
  adAccounts: Array<{ id: string; name: string; currency?: string }>
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
  adAccounts,
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
  }, [view, accountId]) // Only reload on view/account change, not on selections

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
          // Filter campaigns for current account only
          const campaignIdsForAccount = selectedCampaigns
            .filter(c => c.ad_account_id === accountId)
            .map(c => c.id)

          if (campaignIdsForAccount.length === 0) {
            setData([])
            setError('Te rog selectează cel puțin un campaign din acest cont pentru a vedea ad sets')
            setLoading(false)
            return
          }
          result = await api.getClientAdSetsNew(campaignIdsForAccount)
          setData(result.adsets || [])
          break

        case 'ads':
          // Filter ad sets for current account only
          const adSetIdsForAccount = selectedAdSets
            .filter(a => a.ad_account_id === accountId)
            .map(a => a.id)

          if (adSetIdsForAccount.length === 0) {
            setData([])
            setError('Te rog selectează cel puțin un ad set din acest cont pentru a vedea ads')
            setLoading(false)
            return
          }
          result = await api.getClientAdsNew(adSetIdsForAccount)
          setData(result.ads || [])
          break

        case 'creatives':
          // Filter ads for current account only
          const adIdsForAccount = selectedAds
            .filter(a => a.ad_account_id === accountId)
            .map(a => a.id)

          if (adIdsForAccount.length === 0) {
            setData([])
            setError('Te rog selectează cel puțin un ad din acest cont pentru a vedea creatives')
            setLoading(false)
            return
          }
          result = await api.getClientCreativesNew(adIdsForAccount)
          setData(result.creatives || [])
          break

        case 'insights':
          // InsightsView handles its own data loading
          setData([])
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
            accountId={accountId}
            selectedCampaigns={selectedCampaigns}
            onSelectCampaigns={onSelectCampaigns}
          />
        )}
        {view === 'adsets' && (
          <AdSetsTable
            adsets={data}
            loading={loading}
            accountId={accountId}
            selectedAdSets={selectedAdSets}
            onSelectAdSets={onSelectAdSets}
          />
        )}
        {view === 'ads' && (
          <AdsTable
            ads={data}
            loading={loading}
            accountId={accountId}
            selectedAds={selectedAds}
            onSelectAds={onSelectAds}
          />
        )}
        {view === 'creatives' && <CreativesGrid creatives={data} loading={loading} />}
        {view === 'insights' && (
          <InsightsView
            selectedCampaigns={selectedCampaigns}
            selectedAdSets={selectedAdSets}
            selectedAds={selectedAds}
            adAccounts={adAccounts}
          />
        )}
      </div>
    </div>
  )
}
