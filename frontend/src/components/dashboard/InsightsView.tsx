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

interface SelectionItem {
  id: string
  name: string
  ad_account_id: string
}

interface SelectedEntity {
  id: string
  name: string
  customStartDate?: string
  customEndDate?: string
}

interface InsightsViewProps {
  selectedCampaigns: SelectionItem[]
  selectedAdSets: SelectionItem[]
  selectedAds: SelectionItem[]
  adAccounts: Array<{ id: string; name: string; currency?: string }>
}

export default function InsightsView({
  selectedCampaigns,
  selectedAdSets,
  selectedAds,
  adAccounts,
}: InsightsViewProps) {
  // Filters state - now using SelectedEntity with custom time ranges
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedEntity[]>([])
  const [selectedFilterCampaigns, setSelectedFilterCampaigns] = useState<SelectedEntity[]>([])
  const [selectedFilterAdSets, setSelectedFilterAdSets] = useState<SelectedEntity[]>([])
  const [selectedFilterAds, setSelectedFilterAds] = useState<SelectedEntity[]>([])

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

  // Get unique accounts - either from selected items or all available accounts
  const availableAccountIds = useMemo(() => {
    const accountIds = new Set<string>()
    selectedCampaigns.forEach(c => accountIds.add(c.ad_account_id))
    selectedAdSets.forEach(a => accountIds.add(a.ad_account_id))
    selectedAds.forEach(a => accountIds.add(a.ad_account_id))

    // If no selections, use all available ad accounts
    if (accountIds.size === 0) {
      adAccounts.forEach(acc => accountIds.add(acc.id))
    }

    return Array.from(accountIds)
  }, [selectedCampaigns, selectedAdSets, selectedAds, adAccounts])

  // Get currency from first selected account
  const accountCurrency = useMemo(() => {
    if (selectedAccounts.length > 0) {
      const account = adAccounts.find(a => a.id === selectedAccounts[0].id)
      return account?.currency || 'USD'
    }
    // Fallback to first available account
    if (availableAccountIds.length > 0) {
      const account = adAccounts.find(a => a.id === availableAccountIds[0])
      return account?.currency || 'USD'
    }
    return 'USD'
  }, [selectedAccounts, adAccounts, availableAccountIds])

  // Initialize default dates (last 30 days)
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)

    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }, [])

  // Load all available campaigns, adsets, and ads for filters
  useEffect(() => {
    async function loadAllData() {
      if (availableAccountIds.length === 0) {
        setCampaigns([])
        setAdsets([])
        setAds([])
        return
      }

      try {
        // Load campaigns from all available accounts
        const campaignsPromises = availableAccountIds.map(accountId =>
          api.getClientCampaignsNew(accountId)
        )
        const campaignsResults = await Promise.all(campaignsPromises)
        const allCampaigns = campaignsResults.flatMap(result => result.campaigns || [])

        // If user has selected campaigns, use those; otherwise use all
        setCampaigns(selectedCampaigns.length > 0 ? selectedCampaigns : allCampaigns)

        // Load all adsets (backend will filter by permissions)
        const adsetsResult = await api.getClientAdSetsNew([])
        const allAdsets = (adsetsResult.adsets || []).filter((adset: any) =>
          availableAccountIds.includes(adset.ad_account_id)
        )
        setAdsets(selectedAdSets.length > 0 ? selectedAdSets : allAdsets)

        // Load all ads (backend will filter by permissions)
        const adsResult = await api.getClientAdsNew([])
        const allAds = (adsResult.ads || []).filter((ad: any) =>
          availableAccountIds.includes(ad.ad_account_id)
        )
        setAds(selectedAds.length > 0 ? selectedAds : allAds)
      } catch (error) {
        console.error('Failed to load insights filter data:', error)
      }
    }

    loadAllData()
  }, [selectedCampaigns, selectedAdSets, selectedAds, availableAccountIds])

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
      // Build entities list for API call with custom time ranges
      const entities: any[] = []

      selectedAccounts.forEach((entity) => {
        const account = adAccounts.find((a) => a.id === entity.id)
        if (account) {
          entities.push({
            id: entity.id,
            name: entity.name,
            type: 'account',
            start_date: entity.customStartDate || startDate,
            end_date: entity.customEndDate || endDate,
          })
        }
      })

      selectedFilterCampaigns.forEach((entity) => {
        entities.push({
          id: entity.id,
          name: entity.name,
          type: 'campaign',
          start_date: entity.customStartDate || startDate,
          end_date: entity.customEndDate || endDate,
        })
      })

      selectedFilterAdSets.forEach((entity) => {
        entities.push({
          id: entity.id,
          name: entity.name,
          type: 'adset',
          start_date: entity.customStartDate || startDate,
          end_date: entity.customEndDate || endDate,
        })
      })

      selectedFilterAds.forEach((entity) => {
        entities.push({
          id: entity.id,
          name: entity.name,
          type: 'ad',
          start_date: entity.customStartDate || startDate,
          end_date: entity.customEndDate || endDate,
        })
      })

      setChartEntities(entities)

      // Real API call pentru insights
      const result = await api.getClientInsightsAggregate({
        entities,
        start_date: startDate,
        end_date: endDate,
      })

      // Transform flat topPerformers array into separate sorted arrays per metric
      const performers = result.topPerformers || []
      const toEntry = (item: any, value: number) => ({
        entityId: item.id,
        entityName: item.name,
        entityType: item.type,
        value,
      })
      const sortedBy = (metric: string) =>
        [...performers]
          .sort((a: any, b: any) => (b[metric] || 0) - (a[metric] || 0))
          .map((item: any) => toEntry(item, item[metric] || 0))

      setTopPerformers({
        topSpend: sortedBy('spend'),
        topImpressions: sortedBy('impressions'),
        topClicks: sortedBy('clicks'),
        topReach: sortedBy('reach'),
        topCTR: sortedBy('ctr'),
        topCPC: sortedBy('cpc'),
        topCPM: sortedBy('cpm'),
      })
      // Transform flat chartData into pivoted format for MetricsCharts
      // Backend: [{date, entity_id, spend, clicks, ...}, ...]
      // Frontend expects: [{day: 1, spend_<id>: x, clicks_<id>: y, ...}, ...]
      const rawChartData = result.chartData || []
      const metrics = ['spend', 'impressions', 'clicks', 'reach', 'ctr', 'cpc', 'cpm']
      const dateMap: Record<string, any> = {}
      const sortedDates: string[] = []

      rawChartData.forEach((row: any) => {
        const date = row.date
        if (!dateMap[date]) {
          dateMap[date] = { date }
          sortedDates.push(date)
        }
        metrics.forEach((metric) => {
          dateMap[date][`${metric}_${row.entity_id}`] = row[metric] || 0
        })
      })

      sortedDates.sort()
      const pivotedData = sortedDates.map((date, idx) => ({
        day: idx + 1,
        ...dateMap[date],
      }))

      setChartData(pivotedData)
    } catch (err: any) {
      console.error('Failed to load insights:', err)
      alert(`Eroare la încărcarea insights-urilor: ${err.message}`)
    } finally {
      setLoading(false)
    }
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
