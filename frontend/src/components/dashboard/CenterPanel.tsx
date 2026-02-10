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

          // If no campaigns selected, get all adsets for this account
          if (campaignIdsForAccount.length === 0) {
            result = await api.getClientAdSetsNew([])
            // Filter by current account on frontend since backend returns all
            const filteredAdsets = (result.adsets || []).filter((adset: any) => adset.ad_account_id === accountId)
            setData(filteredAdsets)
          } else {
            result = await api.getClientAdSetsNew(campaignIdsForAccount)
            setData(result.adsets || [])
          }
          break

        case 'ads':
          // Get selected campaigns and adsets for current account
          const campaignsForAds = selectedCampaigns
            .filter(c => c.ad_account_id === accountId)
          const adSetsForAds = selectedAdSets
            .filter(a => a.ad_account_id === accountId)

          if (adSetsForAds.length > 0) {
            // If adsets are selected, show ads from those adsets
            result = await api.getClientAdsNew(adSetsForAds.map(a => a.id))
            setData(result.ads || [])
          } else if (campaignsForAds.length > 0) {
            // If only campaigns are selected (no adsets), show all ads from those campaigns
            result = await api.getClientAdsNew([])
            const filteredAds = (result.ads || []).filter((ad: any) =>
              campaignsForAds.some(c => c.id === ad.campaign_id)
            )
            setData(filteredAds)
          } else {
            // If nothing is selected, show all ads for this account
            result = await api.getClientAdsNew([])
            const filteredAds = (result.ads || []).filter((ad: any) => ad.ad_account_id === accountId)
            setData(filteredAds)
          }
          break

        case 'creatives':
          // Get selected campaigns, adsets, and ads for current account
          const campaignsForCreatives = selectedCampaigns
            .filter(c => c.ad_account_id === accountId)
          const adSetsForCreatives = selectedAdSets
            .filter(a => a.ad_account_id === accountId)
          const adsForCreatives = selectedAds
            .filter(a => a.ad_account_id === accountId)

          if (adsForCreatives.length > 0) {
            // If ads are selected, show creatives from those ads
            result = await api.getClientCreativesNew(adsForCreatives.map(a => a.id))
            setData(result.creatives || [])
          } else if (adSetsForCreatives.length > 0) {
            // If only adsets are selected (no ads), show all creatives from those adsets
            result = await api.getClientCreativesNew([])
            const filteredCreatives = (result.creatives || []).filter((creative: any) =>
              adSetsForCreatives.some(a => a.id === creative.adset_id)
            )
            setData(filteredCreatives)
          } else if (campaignsForCreatives.length > 0) {
            // If only campaigns are selected, show all creatives from those campaigns
            result = await api.getClientCreativesNew([])
            const filteredCreatives = (result.creatives || []).filter((creative: any) =>
              campaignsForCreatives.some(c => c.id === creative.campaign_id)
            )
            setData(filteredCreatives)
          } else {
            // If nothing is selected, show all creatives for this account
            result = await api.getClientCreativesNew([])
            const filteredCreatives = (result.creatives || []).filter((creative: any) => creative.ad_account_id === accountId)
            setData(filteredCreatives)
          }
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
