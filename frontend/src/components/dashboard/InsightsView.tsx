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

  // Get unique accounts from selected items
  const availableAccountIds = useMemo(() => {
    const accountIds = new Set<string>()
    selectedCampaigns.forEach(c => accountIds.add(c.ad_account_id))
    selectedAdSets.forEach(a => accountIds.add(a.ad_account_id))
    selectedAds.forEach(a => accountIds.add(a.ad_account_id))
    return Array.from(accountIds)
  }, [selectedCampaigns, selectedAdSets, selectedAds])

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

  // Use selected items directly as filter options (they already have all needed info)
  useEffect(() => {
    setCampaigns(selectedCampaigns)
    setAdsets(selectedAdSets)
    setAds(selectedAds)
  }, [selectedCampaigns, selectedAdSets, selectedAds])

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

      // Ensure we have safe defaults if API returns undefined
      setTopPerformers(result.topPerformers || {
        topSpend: [],
        topImpressions: [],
        topClicks: [],
        topReach: [],
        topCTR: [],
        topCPC: [],
        topCPM: []
      })
      setChartData(result.chartData || [])
    } catch (err: any) {
      console.error('Failed to load insights:', err)
      alert(`Eroare la încărcarea insights-urilor: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }


  const hasAnySelections = selectedCampaigns.length > 0 || selectedAdSets.length > 0 || selectedAds.length > 0

  if (!hasAnySelections) {
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
            Nu există selecții salvate
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Navighează la secțiunile Campaigns, Ad Sets sau Ads și selectează obiectele pe care vrei să le analizezi
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
