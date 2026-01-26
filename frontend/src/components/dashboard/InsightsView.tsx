/**
 * InsightsView Component - NEW
 * Complete insights interface with filters, top performers, and charts
 */

'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import InsightsFilters from './insights/InsightsFilters'
import MetricsCards from './insights/MetricsCards'
import MetricsCharts from './insights/MetricsCharts'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface InsightsViewProps {
  accountId: string | null
  selectedCampaigns: string[]
  selectedAdSets: string[]
  selectedAds: string[]
  adAccounts: Array<{ id: string; name: string }>
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

  // Initialize default dates (last 30 days)
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)

    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }, [])

  // Auto-select current account
  useEffect(() => {
    if (accountId && !selectedAccounts.includes(accountId)) {
      setSelectedAccounts([accountId])
    }
  }, [accountId])

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

      // TODO: Real API call pentru insights
      // Pentru moment, generăm date mock
      const mockTopPerformers = generateMockTopPerformers(entities)
      const mockChartData = generateMockChartData(entities, startDate, endDate)

      setTopPerformers(mockTopPerformers)
      setChartData(mockChartData)
    } catch (err) {
      console.error('Failed to load insights:', err)
    } finally {
      setLoading(false)
    }
  }

  // Mock data generators (replace with real API calls)
  const generateMockTopPerformers = (entities: any[]) => {
    const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5)

    return {
      topSpend: shuffle(entities)
        .slice(0, 5)
        .map((e, i) => ({
          entityId: e.id,
          entityName: e.name,
          entityType: e.type,
          value: Math.random() * 1000 * (5 - i),
        })),
      topImpressions: shuffle(entities)
        .slice(0, 5)
        .map((e, i) => ({
          entityId: e.id,
          entityName: e.name,
          entityType: e.type,
          value: Math.floor(Math.random() * 50000 * (5 - i)),
        })),
      topClicks: shuffle(entities)
        .slice(0, 5)
        .map((e, i) => ({
          entityId: e.id,
          entityName: e.name,
          entityType: e.type,
          value: Math.floor(Math.random() * 2000 * (5 - i)),
        })),
      topReach: shuffle(entities)
        .slice(0, 5)
        .map((e, i) => ({
          entityId: e.id,
          entityName: e.name,
          entityType: e.type,
          value: Math.floor(Math.random() * 30000 * (5 - i)),
        })),
      topCTR: shuffle(entities)
        .slice(0, 5)
        .map((e, i) => ({
          entityId: e.id,
          entityName: e.name,
          entityType: e.type,
          value: Math.random() * 5 * (5 - i),
        })),
      topCPC: shuffle(entities)
        .slice(0, 5)
        .map((e, i) => ({
          entityId: e.id,
          entityName: e.name,
          entityType: e.type,
          value: Math.random() * 3 * (5 - i),
        })),
      topCPM: shuffle(entities)
        .slice(0, 5)
        .map((e, i) => ({
          entityId: e.id,
          entityName: e.name,
          entityType: e.type,
          value: Math.random() * 50 * (5 - i),
        })),
    }
  }

  const generateMockChartData = (entities: any[], start: string, end: string) => {
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    )

    const data = []
    for (let i = 0; i <= days; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)

      const dataPoint: any = {
        date: date.toISOString().split('T')[0],
      }

      entities.forEach((entity) => {
        const baseMultiplier = entity.type === 'account' ? 1 : entity.type === 'campaign' ? 0.7 : 0.5
        dataPoint[`spend_${entity.id}`] = Math.random() * 100 * baseMultiplier
        dataPoint[`impressions_${entity.id}`] = Math.floor(Math.random() * 5000 * baseMultiplier)
        dataPoint[`clicks_${entity.id}`] = Math.floor(Math.random() * 100 * baseMultiplier)
        dataPoint[`reach_${entity.id}`] = Math.floor(Math.random() * 3000 * baseMultiplier)
        dataPoint[`ctr_${entity.id}`] = Math.random() * 5
        dataPoint[`cpc_${entity.id}`] = Math.random() * 2
        dataPoint[`cpm_${entity.id}`] = Math.random() * 50
      })

      data.push(dataPoint)
    }

    return data
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
          />

          {/* Charts */}
          {chartData.length > 0 && chartEntities.length > 0 && (
            <MetricsCharts data={chartData} entities={chartEntities} />
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
