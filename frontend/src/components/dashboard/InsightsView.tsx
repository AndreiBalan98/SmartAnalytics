/**
 * InsightsView Component - NEW
 * Complete insights interface with filters, metrics cards, and charts
 */

'use client'

import { useState, useEffect } from 'react'
import InsightsFilters from './insights/InsightsFilters'
import MetricsCards from './insights/MetricsCards'
import MetricsCharts from './insights/MetricsCharts'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface InsightsViewProps {
  accountId: string | null
  selectedCampaigns: string[]
  selectedAdSets: string[]
  selectedAds: string[]
}

export default function InsightsView({
  accountId,
  selectedCampaigns,
  selectedAdSets,
  selectedAds,
}: InsightsViewProps) {
  // Filters state
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [selectedFilterCampaigns, setSelectedFilterCampaigns] = useState<string[]>([])
  const [selectedFilterAdSets, setSelectedFilterAdSets] = useState<string[]>([])
  const [selectedFilterAds, setSelectedFilterAds] = useState<string[]>([])

  // Time range state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [compareStartDate, setCompareStartDate] = useState('')
  const [compareEndDate, setCompareEndDate] = useState('')

  // Data state
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string }>>([])
  const [adsets, setAdsets] = useState<Array<{ id: string; name: string }>>([])
  const [ads, setAds] = useState<Array<{ id: string; name: string }>>([])

  const [loading, setLoading] = useState(false)
  const [metricsData, setMetricsData] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])

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

  // Load available options based on selections
  useEffect(() => {
    // TODO: Load accounts, campaigns, adsets, ads based on selections
    // For now, using placeholder data
    if (accountId) {
      setAccounts([{ id: accountId, name: 'Current Account' }])
    }
  }, [accountId, selectedAccounts])

  // Mock data for now - replace with API call
  useEffect(() => {
    if (selectedAccounts.length > 0 && startDate && endDate) {
      // Mock metrics data
      setMetricsData({
        totalSpend: 1234.56,
        impressions: 45678,
        clicks: 1234,
        reach: 23456,
        ctr: 2.7,
        cpc: 1.0,
        cpm: 27.02,
      })

      // Mock chart data
      const mockChartData = []
      const days = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )

      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        mockChartData.push({
          date: date.toISOString().split('T')[0],
          spend_account1: Math.random() * 100,
          impressions_account1: Math.random() * 5000,
          clicks_account1: Math.random() * 100,
          reach_account1: Math.random() * 3000,
          ctr_account1: Math.random() * 5,
          cpc_account1: Math.random() * 2,
          cpm_account1: Math.random() * 50,
        })
      }

      setChartData(mockChartData)
    }
  }, [selectedAccounts, startDate, endDate])

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
        accounts={accounts}
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
        compareMode={compareMode}
        onCompareModeChange={setCompareMode}
        compareStartDate={compareStartDate}
        compareEndDate={compareEndDate}
        onCompareStartDateChange={setCompareStartDate}
        onCompareEndDateChange={setCompareEndDate}
      />

      {loading && (
        <div style={{ padding: '2rem' }}>
          <LoadingSpinner message="Se încarcă insights..." />
        </div>
      )}

      {!loading && metricsData && (
        <>
          {/* Metrics Cards */}
          <MetricsCards
            metrics={metricsData}
            topPerformers={{
              totalSpend: {
                type: 'campaign',
                name: 'Summer Sale Campaign',
                value: 456.78,
              },
              impressions: {
                type: 'adset',
                name: 'Target Audience 25-35',
                value: 12345,
              },
            }}
          />

          {/* Charts */}
          <MetricsCharts
            data={chartData}
            entities={[
              { id: 'account1', name: 'Current Account', type: 'account' },
            ]}
          />
        </>
      )}

      {!loading && !metricsData && (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#9ca3af',
          }}
        >
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
            Selectează criterii de filtrare
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Alege ad accounts, campaigns, ad sets sau ads pentru a vedea insights
          </p>
        </div>
      )}
    </div>
  )
}
