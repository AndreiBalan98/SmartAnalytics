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
import OverviewView from './OverviewView'
import GA4InsightsView from './GA4InsightsView'
import GoogleAdsInsightsView from './GoogleAdsInsightsView'
import LeadsTable from './LeadsTable'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface SelectionItem {
  id: string
  name: string
  ad_account_id: string
}

type Platform = 'meta' | 'google_ads' | 'ga4'

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
  platform?: Platform
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
  platform = 'meta',
}: CenterPanelProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [leadsData, setLeadsData] = useState<any[]>([])
  const [leadsTotal, setLeadsTotal] = useState(0)

  useEffect(() => {
    if (view === 'leads') {
      loadLeads()
      return
    }

    if (!accountId) {
      setData([])
      return
    }

    loadData()
  }, [view, accountId, platform]) // Reload on view/account/platform change

  async function loadLeads() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getClientLeads({ limit: 100 })
      setLeadsData(result.leads || [])
      setLeadsTotal(result.total || 0)
    } catch (err: any) {
      console.error('Failed to load leads:', err)
      setError(err.message || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  async function loadData() {
    if (!accountId) return

    setLoading(true)
    setError(null)

    try {
      let result: any

      // GA4 only has insights view
      if (platform === 'ga4') {
        setData([])
        setLoading(false)
        return
      }

      // Google Ads platform
      if (platform === 'google_ads') {
        switch (view) {
          case 'campaigns':
            result = await api.getClientGoogleAdsCampaigns(accountId)
            setData(result.campaigns || [])
            break

          case 'adsets': // ad groups for Google Ads
            const gCampaignIds = selectedCampaigns
              .filter(c => c.ad_account_id === accountId)
              .map(c => c.id)

            if (gCampaignIds.length === 0) {
              result = await api.getClientGoogleAdsAdGroups([])
              const filtered = (result.ad_groups || []).filter((ag: any) => ag.ad_account_id === accountId)
              setData(filtered)
            } else {
              result = await api.getClientGoogleAdsAdGroups(gCampaignIds)
              setData(result.ad_groups || [])
            }
            break

          case 'ads':
            const gCampaignsForAds = selectedCampaigns
              .filter(c => c.ad_account_id === accountId)
            const gAdGroupsForAds = selectedAdSets
              .filter(a => a.ad_account_id === accountId)

            if (gAdGroupsForAds.length > 0) {
              result = await api.getClientGoogleAdsAds(gAdGroupsForAds.map(a => a.id))
              setData(result.ads || [])
            } else if (gCampaignsForAds.length > 0) {
              result = await api.getClientGoogleAdsAds([])
              const filtered = (result.ads || []).filter((ad: any) =>
                gCampaignsForAds.some(c => c.id === ad.campaign_id)
              )
              setData(filtered)
            } else {
              result = await api.getClientGoogleAdsAds([])
              const filtered = (result.ads || []).filter((ad: any) => ad.ad_account_id === accountId)
              setData(filtered)
            }
            break

          case 'insights':
            setData([])
            break

          default:
            setData([])
        }
        setLoading(false)
        return
      }

      // Meta platform (default)
      switch (view) {
        case 'campaigns':
          result = await api.getClientCampaignsNew(accountId)
          setData(result.campaigns || [])
          break

        case 'adsets':
          const campaignIdsForAccount = selectedCampaigns
            .filter(c => c.ad_account_id === accountId)
            .map(c => c.id)

          if (campaignIdsForAccount.length === 0) {
            result = await api.getClientAdSetsNew([])
            const filteredAdsets = (result.adsets || []).filter((adset: any) => adset.ad_account_id === accountId)
            setData(filteredAdsets)
          } else {
            result = await api.getClientAdSetsNew(campaignIdsForAccount)
            setData(result.adsets || [])
          }
          break

        case 'ads':
          const campaignsForAds = selectedCampaigns
            .filter(c => c.ad_account_id === accountId)
          const adSetsForAds = selectedAdSets
            .filter(a => a.ad_account_id === accountId)

          if (adSetsForAds.length > 0) {
            result = await api.getClientAdsNew(adSetsForAds.map(a => a.id))
            setData(result.ads || [])
          } else if (campaignsForAds.length > 0) {
            result = await api.getClientAdsNew([])
            const filteredAds = (result.ads || []).filter((ad: any) =>
              campaignsForAds.some(c => c.id === ad.campaign_id)
            )
            setData(filteredAds)
          } else {
            result = await api.getClientAdsNew([])
            const filteredAds = (result.ads || []).filter((ad: any) => ad.ad_account_id === accountId)
            setData(filteredAds)
          }
          break

        case 'creatives':
          const campaignsForCreatives = selectedCampaigns
            .filter(c => c.ad_account_id === accountId)
          const adSetsForCreatives = selectedAdSets
            .filter(a => a.ad_account_id === accountId)
          const adsForCreatives = selectedAds
            .filter(a => a.ad_account_id === accountId)

          if (adsForCreatives.length > 0) {
            result = await api.getClientCreativesNew(adsForCreatives.map(a => a.id))
            setData(result.creatives || [])
          } else if (adSetsForCreatives.length > 0) {
            result = await api.getClientCreativesNew([])
            const filteredCreatives = (result.creatives || []).filter((creative: any) =>
              adSetsForCreatives.some(a => a.id === creative.adset_id)
            )
            setData(filteredCreatives)
          } else if (campaignsForCreatives.length > 0) {
            result = await api.getClientCreativesNew([])
            const filteredCreatives = (result.creatives || []).filter((creative: any) =>
              campaignsForCreatives.some(c => c.id === creative.campaign_id)
            )
            setData(filteredCreatives)
          } else {
            result = await api.getClientCreativesNew([])
            const filteredCreatives = (result.creatives || []).filter((creative: any) => creative.ad_account_id === accountId)
            setData(filteredCreatives)
          }
          break

        case 'insights':
          setData([])
          break

        case 'overview':
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

  if (!accountId && view !== 'overview' && view !== 'leads') {
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
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{platform === 'ga4' ? '📈' : '📊'}</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#6b7280' }}>
            {platform === 'ga4' ? 'Select a Property' : 'Select an Ad Account'}
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            {platform === 'ga4'
              ? 'Choose a property from the left panel to view analytics'
              : 'Choose an ad account from the left panel to view data'}
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
          {platform === 'google_ads' && view === 'adsets' ? 'Ad Groups' : view}
        </h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }} className="scrollbar-hidden">
        {/* GA4 Platform */}
        {platform === 'ga4' && view === 'insights' && (
          <GA4InsightsView propertyId={accountId} />
        )}

        {/* Google Ads Platform */}
        {platform === 'google_ads' && view === 'campaigns' && (
          <CampaignsTable
            campaigns={data}
            loading={loading}
            accountId={accountId}
            selectedCampaigns={selectedCampaigns}
            onSelectCampaigns={onSelectCampaigns}
          />
        )}
        {platform === 'google_ads' && view === 'adsets' && (
          <AdSetsTable
            adsets={data}
            loading={loading}
            accountId={accountId}
            selectedAdSets={selectedAdSets}
            onSelectAdSets={onSelectAdSets}
          />
        )}
        {platform === 'google_ads' && view === 'ads' && (
          <AdsTable
            ads={data}
            loading={loading}
            accountId={accountId}
            selectedAds={selectedAds}
            onSelectAds={onSelectAds}
          />
        )}
        {platform === 'google_ads' && view === 'insights' && (
          <GoogleAdsInsightsView
            accountId={accountId}
            selectedCampaigns={selectedCampaigns}
            selectedAdSets={selectedAdSets}
            selectedAds={selectedAds}
          />
        )}

        {/* Meta Platform (default) */}
        {platform === 'meta' && view === 'campaigns' && (
          <CampaignsTable
            campaigns={data}
            loading={loading}
            accountId={accountId}
            selectedCampaigns={selectedCampaigns}
            onSelectCampaigns={onSelectCampaigns}
          />
        )}
        {platform === 'meta' && view === 'adsets' && (
          <AdSetsTable
            adsets={data}
            loading={loading}
            accountId={accountId}
            selectedAdSets={selectedAdSets}
            onSelectAdSets={onSelectAdSets}
          />
        )}
        {platform === 'meta' && view === 'ads' && (
          <AdsTable
            ads={data}
            loading={loading}
            accountId={accountId}
            selectedAds={selectedAds}
            onSelectAds={onSelectAds}
          />
        )}
        {platform === 'meta' && view === 'creatives' && (
          <CreativesGrid creatives={data} loading={loading} />
        )}
        {platform === 'meta' && view === 'insights' && (
          <InsightsView
            selectedCampaigns={selectedCampaigns}
            selectedAdSets={selectedAdSets}
            selectedAds={selectedAds}
            adAccounts={adAccounts}
          />
        )}

        {/* Leads (platform-independent) */}
        {view === 'leads' && (
          <LeadsTable leads={leadsData} loading={loading} />
        )}

        {/* Overview (platform-independent) */}
        {view === 'overview' && (
          <OverviewView
            selectedCampaigns={selectedCampaigns}
            selectedAdSets={selectedAdSets}
            selectedAds={selectedAds}
            adAccounts={adAccounts}
            selectedAccount={accountId}
          />
        )}
      </div>
    </div>
  )
}
