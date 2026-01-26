/**
 * InsightsView Component - NEW
 * Complete insights interface with filters, top performers, and charts
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, getCurrencySymbol } from '@/lib/currency'
import InsightsFilters from './insights/InsightsFilters'
import MetricsCards from './insights/MetricsCards'
import MetricsCharts from './insights/MetricsCharts'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface InsightsViewProps {
  accountId: string | null
  selectedCampaigns: string[]
  selectedAdSets: string[]
  selectedAds: string[]
  adAccounts: Array<{ id: string; name: string; currency?: string }>
}

export default function InsightsView({
  accountId,
  selectedCampaigns,
  selectedAdSets,
  selectedAds,
  adAccounts,
}: InsightsViewProps) {
  // Filters state
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedFilterCampaigns, setSelectedFilterCampaigns] = useState<string[]>([])
  const [selectedFilterAdSets, setSelectedFilterAdSets] = useState<string[]>([])
  const [selectedFilterAds, setSelectedFilterAds] = useState<string[]>([])

  // Time range state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Data state
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([])
  const [adsets, setAdsets] = useState<Array<{ id: string; name: string }>>([])
  const [ads, setAds] = useState<Array<{ id: string; name: string }>>([])

  const [loading, setLoading] = useState(false)
  const [topPerformers, setTopPerformers] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartEntities, setChartEntities] = useState<any[]>([])

  // Get currency from first selected account, or fall back to current account
  const accountCurrency = useMemo(() => {
    if (selectedAccounts.length > 0) {
      const account = adAccounts.find(a => a.id === selectedAccounts[0])
      return account?.currency || 'USD'
    }
    // Fallback to current account if no selections
    const currentAccount = adAccounts.find(a => a.id === accountId)
    return currentAccount?.currency || 'USD'
  }, [selectedAccounts, adAccounts, accountId])

  // Initialize default dates (last 30 days)
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)

    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }, [])

  // Auto-select current account - DISABLED: users must explicitly select
  // useEffect(() => {
  //   if (accountId && !selectedAccounts.includes(accountId)) {
  //     setSelectedAccounts([accountId])
  //   }
  // }, [accountId])

  // Load ALL campaigns/adsets/ads options for the account
  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!accountId) {
        setCampaigns([])
        setAdsets([])
        setAds([])
        return
      }

      try {
        // Load ALL campaigns from the account
        const campaignsResult = await api.getClientCampaignsNew(accountId)
        setCampaigns(campaignsResult.campaigns || [])

        // Load ALL adsets from all campaigns in this account
        if (campaignsResult.campaigns && campaignsResult.campaigns.length > 0) {
          const campaignIds = campaignsResult.campaigns.map((c: any) => c.id)
          const adsetsResult = await api.getClientAdSetsNew(campaignIds)
          setAdsets(adsetsResult.adsets || [])

          // Load ALL ads from all adsets
          if (adsetsResult.adsets && adsetsResult.adsets.length > 0) {
            const adsetIds = adsetsResult.adsets.map((a: any) => a.id)
            const adsResult = await api.getClientAdsNew(adsetIds)
            setAds(adsResult.ads || [])
          } else {
            setAds([])
          }
        } else {
          setAdsets([])
          setAds([])
        }
      } catch (err) {
        console.error('Failed to load filter options:', err)
      }
    }

    loadFilterOptions()
  }, [accountId])

  // Manual generate function - only loads data when button is clicked
  const handleGenerate = async () => {
    // Verificăm dacă avem selecții
    const hasSelections =
      selectedAccounts.length > 0 ||
      selectedFilterCampaigns.length > 0 ||
      selectedFilterAdSets.length > 0 ||
      selectedFilterAds.length > 0

    if (!hasSelections || !startDate || !endDate) {
      return
    }

    setLoading(true)
    try {
      // Build entities list for API call
      const entities: any[] = []

      selectedAccounts.forEach((id) => {
        const account = adAccounts.find((a) => a.id === id)
        if (account) {
          entities.push({ id, name: account.name, type: 'account' })
        }
      })

      selectedFilterCampaigns.forEach((id) => {
        const campaign = campaigns.find((c) => c.id === id)
        if (campaign) {
          entities.push({ id, name: campaign.name, type: 'campaign' })
        }
      })

      selectedFilterAdSets.forEach((id) => {
        const adset = adsets.find((a) => a.id === id)
        if (adset) {
          entities.push({ id, name: adset.name, type: 'adset' })
        }
      })

      selectedFilterAds.forEach((id) => {
        const ad = ads.find((a) => a.id === id)
        if (ad) {
          entities.push({ id, name: ad.name, type: 'ad' })
        }
      })

      setChartEntities(entities)

      // Real API call pentru insights
      const result = await api.getClientInsightsAggregate({
        entities,
        start_date: startDate,
        end_date: endDate,
      })

      setTopPerformers(result.topPerformers)
      setChartData(result.chartData)
    } catch (err: any) {
      console.error('Failed to load insights:', err)
      alert(`Eroare la încărcarea insights-urilor: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }


  if (!accountId) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
      >
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#6b7280' }}>
            Selectează un Ad Account
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Alege un ad account din panoul din stânga pentru a vedea insights
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }} className="scrollbar-hidden">
      {/* Filters */}
      <InsightsFilters
        accounts={adAccounts}
        campaigns={campaigns}
        adsets={adsets}
        ads={ads}
        selectedAccounts={selectedAccounts}
        selectedCampaigns={selectedFilterCampaigns}
        selectedAdSets={selectedFilterAdSets}
        selectedAds={selectedFilterAds}
        onSelectAccounts={setSelectedAccounts}
        onSelectCampaigns={setSelectedFilterCampaigns}
        onSelectAdSets={setSelectedFilterAdSets}
        onSelectAds={setSelectedFilterAds}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onGenerate={handleGenerate}
        loading={loading}
      />

      {loading && (
        <div style={{ padding: '2rem' }}>
          <LoadingSpinner message="Se încarcă insights..." />
        </div>
      )}

      {!loading && topPerformers && (
        <>
          {/* Metrics Cards cu Top Performers */}
          <MetricsCards
            topSpend={topPerformers.topSpend}
            topImpressions={topPerformers.topImpressions}
            topClicks={topPerformers.topClicks}
            topReach={topPerformers.topReach}
            topCTR={topPerformers.topCTR}
            topCPC={topPerformers.topCPC}
            topCPM={topPerformers.topCPM}
            currency={accountCurrency}
          />

          {/* Charts */}
          {chartData.length > 0 && chartEntities.length > 0 && (
            <MetricsCharts data={chartData} entities={chartEntities} currency={accountCurrency} />
          )}
        </>
      )}

      {!loading && !topPerformers && (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#9ca3af',
          }}
        >
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            Selectează obiecte pentru a vedea insights
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Alege ad accounts, campaigns, ad sets sau ads din dropdowns pentru a genera rapoarte
          </p>
        </div>
      )}
    </div>
  )
}
