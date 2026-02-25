/**
 * OverviewView Component
 * Complete dashboard overview with metrics cards, top campaigns, and detailed tables
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, getCurrencySymbol } from '@/lib/currency'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface SelectionItem {
  id: string
  name: string
  ad_account_id: string
}

interface OverviewViewProps {
  selectedCampaigns: SelectionItem[]
  selectedAdSets: SelectionItem[]
  selectedAds: SelectionItem[]
  adAccounts: Array<{ id: string; name: string; currency?: string }>
  selectedAccount: string | null
}

// Helper to calculate date range for comparison
function getPreviousPeriod(startDate: string, endDate: string): { start: string; end: string } {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()

  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000) // Day before start
  const prevStart = new Date(prevEnd.getTime() - diff)

  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0],
  }
}

// Helper to extract purchases from actions
function extractPurchases(insights: any): { purchases: number; purchaseValue: number } {
  let purchases = 0
  let purchaseValue = 0

  if (insights.actions) {
    insights.actions.forEach((action: any) => {
      if (action.action_type && action.action_type.toLowerCase().includes('purchase')) {
        purchases += parseFloat(action.value || 0)
      }
    })
  }

  if (insights.action_values) {
    insights.action_values.forEach((actionValue: any) => {
      if (actionValue.action_type && actionValue.action_type.toLowerCase().includes('purchase')) {
        purchaseValue += parseFloat(actionValue.value || 0)
      }
    })
  }

  return { purchases, purchaseValue }
}

// Calculate metrics from insights data
function calculateMetrics(insights: any[]) {
  const totalSpend = insights.reduce((sum, item) => sum + parseFloat(item.spend || 0), 0)
  const totalImpressions = insights.reduce((sum, item) => sum + parseInt(item.impressions || 0, 10), 0)
  const totalClicks = insights.reduce((sum, item) => sum + parseInt(item.clicks || 0, 10), 0)
  const totalReach = insights.reduce((sum, item) => sum + parseInt(item.reach || 0, 10), 0)

  let totalPurchases = 0
  let totalPurchaseValue = 0

  insights.forEach(item => {
    const { purchases, purchaseValue } = extractPurchases(item)
    totalPurchases += purchases
    totalPurchaseValue += purchaseValue
  })

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0
  const roas = totalSpend > 0 ? totalPurchaseValue / totalSpend : 0

  return {
    spend: totalSpend,
    impressions: totalImpressions,
    clicks: totalClicks,
    reach: totalReach,
    purchases: totalPurchases,
    purchaseValue: totalPurchaseValue,
    ctr,
    cpc,
    cpm,
    cpa,
    roas,
  }
}

export default function OverviewView({
  selectedCampaigns,
  selectedAdSets,
  selectedAds,
  adAccounts,
  selectedAccount,
}: OverviewViewProps) {
  // Filters
  const [platform, setPlatform] = useState('meta')
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>('')
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Data
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [currentMetrics, setCurrentMetrics] = useState<any>(null)
  const [previousMetrics, setPreviousMetrics] = useState<any>(null)
  const [dailyData, setDailyData] = useState<any[]>([])
  const [topCampaigns, setTopCampaigns] = useState<any[]>([])
  const [hierarchicalData, setHierarchicalData] = useState<any[]>([])
  const [topCreatives, setTopCreatives] = useState<any[]>([])

  // Get currency
  const currency = useMemo(() => {
    const account = adAccounts.find(a => a.id === (selectedAdAccount || selectedAccount))
    return account?.currency || 'USD'
  }, [selectedAdAccount, selectedAccount, adAccounts])

  // Initialize dates (last 7 days)
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)

    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }, [])

  // Auto-select account if one is selected in the sidebar
  useEffect(() => {
    if (selectedAccount && !selectedAdAccount) {
      setSelectedAdAccount(selectedAccount)
    }
  }, [selectedAccount])

  // Load campaigns when account changes
  useEffect(() => {
    async function loadCampaigns() {
      if (!selectedAdAccount) {
        setCampaigns([])
        return
      }

      try {
        const result = await api.getClientCampaignsNew(selectedAdAccount)
        setCampaigns(result.campaigns || [])
      } catch (error) {
        console.error('Failed to load campaigns:', error)
      }
    }

    loadCampaigns()
  }, [selectedAdAccount])

  // Load data function
  const handleLoadData = async () => {
    if (!selectedAdAccount || !startDate || !endDate) {
      return
    }

    setLoading(true)

    try {
      // Build params for current period
      const params: any = {
        account_id: selectedAdAccount,
        start_date: startDate,
        end_date: endDate,
        level: selectedCampaign ? 'campaign' : 'account',
      }

      if (selectedCampaign) {
        params.campaign_id = selectedCampaign
      }

      // Fetch current period data
      const currentData = await api.getClientInsights(params)

      // Calculate previous period
      const prevPeriod = getPreviousPeriod(startDate, endDate)
      const prevParams = { ...params, start_date: prevPeriod.start, end_date: prevPeriod.end }

      // Fetch previous period data
      const previousData = await api.getClientInsights(prevParams)

      // Calculate metrics
      const current = calculateMetrics(currentData.insights || [])
      const previous = calculateMetrics(previousData.insights || [])

      setCurrentMetrics(current)
      setPreviousMetrics(previous)

      // Process daily data for charts
      const daily = processDailyData(currentData.insights || [])
      setDailyData(daily)

      // Load additional data for tables
      await loadTableData()

    } catch (error) {
      console.error('Failed to load overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Process daily data for bar charts
  function processDailyData(insights: any[]) {
    const dailyMap: { [key: string]: any } = {}

    insights.forEach(item => {
      const date = item.date
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          spend: 0,
          impressions: 0,
          clicks: 0,
          reach: 0,
          purchases: 0,
          purchaseValue: 0,
        }
      }

      dailyMap[date].spend += parseFloat(item.spend || 0)
      dailyMap[date].impressions += parseInt(item.impressions || 0, 10)
      dailyMap[date].clicks += parseInt(item.clicks || 0, 10)
      dailyMap[date].reach += parseInt(item.reach || 0, 10)

      const { purchases, purchaseValue } = extractPurchases(item)
      dailyMap[date].purchases += purchases
      dailyMap[date].purchaseValue += purchaseValue
    })

    return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
  }

  // Load table data
  async function loadTableData() {
    if (!selectedAdAccount) return

    try {
      // Load campaigns with insights for top campaigns table
      const campaignsResult = await api.getClientCampaignsNew(selectedAdAccount)
      const campaignsData = campaignsResult.campaigns || []

      // Get all campaign insights at once
      const campaignInsights = await api.getClientInsights({
        account_id: selectedAdAccount,
        level: 'campaign',
        start_date: startDate,
        end_date: endDate,
      })

      // Map insights to campaigns
      const campaignsWithMetrics = campaignsData.slice(0, 20).map((campaign: any) => {
        const campaignInsightsData = (campaignInsights.insights || []).filter(
          (insight: any) => insight.object_id === campaign.campaign_id
        )

        const metrics = calculateMetrics(campaignInsightsData)
        return {
          ...campaign,
          ...metrics,
        }
      })

      // Sort by CTR and set top campaigns
      const sorted = campaignsWithMetrics.sort((a: any, b: any) => (b.ctr || 0) - (a.ctr || 0))
      setTopCampaigns(sorted.slice(0, 10))

      // Load hierarchical data (campaigns -> adsets -> ads)
      await loadHierarchicalData()

      // Load top creatives
      await loadTopCreatives()

    } catch (error) {
      console.error('Failed to load table data:', error)
    }
  }

  // Load hierarchical data
  async function loadHierarchicalData() {
    if (!selectedAdAccount) return

    try {
      // Load campaigns
      const campaignsResult = await api.getClientCampaignsNew(selectedAdAccount)
      const campaignsData = campaignsResult.campaigns || []

      // For each campaign, load adsets and ads
      const hierarchical = await Promise.all(
        campaignsData.slice(0, 5).map(async (campaign: any) => {
          try {
            // Get adsets for this campaign
            const adsetsResult = await api.getClientAdSetsNew([campaign.campaign_id])
            const adsets = adsetsResult.adsets || []

            // For each adset, get ads
            const adsetsWithAds = await Promise.all(
              adsets.slice(0, 3).map(async (adset: any) => {
                try {
                  const adsResult = await api.getClientAdsNew([adset.adset_id])
                  const ads = adsResult.ads || []

                  // Get all ad insights for this adset
                  let adsWithInsights: any[] = []
                  try {
                    const adInsights = await api.getClientInsights({
                      account_id: selectedAdAccount,
                      level: 'ad',
                      start_date: startDate,
                      end_date: endDate,
                    })

                    // Map insights to ads
                    adsWithInsights = ads.slice(0, 5).map((ad: any) => {
                      const adInsightsData = (adInsights.insights || []).filter(
                        (insight: any) => insight.object_id === ad.ad_id
                      )

                      const metrics = calculateMetrics(adInsightsData)
                      return { ...ad, ...metrics }
                    })
                  } catch (error) {
                    adsWithInsights = ads.slice(0, 5).map((ad: any) => ({
                      ...ad,
                      clicks: 0,
                      impressions: 0,
                      ctr: 0,
                    }))
                  }

                  // Calculate adset metrics from ads
                  const adsetMetrics = {
                    clicks: adsWithInsights.reduce((sum, ad) => sum + (ad.clicks || 0), 0),
                    impressions: adsWithInsights.reduce((sum, ad) => sum + (ad.impressions || 0), 0),
                  }
                  const adsetCTR = adsetMetrics.impressions > 0
                    ? (adsetMetrics.clicks / adsetMetrics.impressions) * 100
                    : 0

                  return {
                    ...adset,
                    ...adsetMetrics,
                    ctr: adsetCTR,
                    ads: adsWithInsights,
                  }
                } catch (error) {
                  return { ...adset, clicks: 0, impressions: 0, ctr: 0, ads: [] }
                }
              })
            )

            // Calculate campaign metrics from adsets
            const campaignMetrics = {
              clicks: adsetsWithAds.reduce((sum, adset) => sum + (adset.clicks || 0), 0),
              impressions: adsetsWithAds.reduce((sum, adset) => sum + (adset.impressions || 0), 0),
            }
            const campaignCTR = campaignMetrics.impressions > 0
              ? (campaignMetrics.clicks / campaignMetrics.impressions) * 100
              : 0

            return {
              ...campaign,
              ...campaignMetrics,
              ctr: campaignCTR,
              adsets: adsetsWithAds,
            }
          } catch (error) {
            return { ...campaign, clicks: 0, impressions: 0, ctr: 0, adsets: [] }
          }
        })
      )

      setHierarchicalData(hierarchical)
    } catch (error) {
      console.error('Failed to load hierarchical data:', error)
      setHierarchicalData([])
    }
  }

  // Load top creatives
  async function loadTopCreatives() {
    if (!selectedAdAccount) return

    try {
      // Load all ads for the account
      const adsResult = await api.getClientAdsNew([])
      const allAds = (adsResult.ads || []).filter((ad: any) => ad.ad_account_id === selectedAdAccount)

      // Get all ad insights at once
      const adInsights = await api.getClientInsights({
        account_id: selectedAdAccount,
        level: 'ad',
        start_date: startDate,
        end_date: endDate,
      })

      // Map insights to ads
      const creativesWithMetrics = allAds.slice(0, 20).map((ad: any) => {
        const adInsightsData = (adInsights.insights || []).filter(
          (insight: any) => insight.object_id === ad.ad_id
        )

        const metrics = calculateMetrics(adInsightsData)
        return {
          ad_id: ad.ad_id,
          ad_name: ad.name,
          creative_title: ad.creative?.title || ad.name || 'Untitled',
          creative_image: ad.creative?.image_url || ad.creative?.thumbnail_url,
          ...metrics,
        }
      })

      // Sort by CTR and set top creatives
      const sorted = creativesWithMetrics.sort((a: any, b: any) => (b.ctr || 0) - (a.ctr || 0))
      setTopCreatives(sorted)
    } catch (error) {
      console.error('Failed to load top creatives:', error)
      setTopCreatives([])
    }
  }

  // Calculate percentage change
  function getPercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return (
    <div className="scrollbar-hidden" style={{ height: '100%', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
      {/* Header with filters */}
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
      }}>
        {/* Platform Selector */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setPlatform('meta')}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: platform === 'meta' ? '#3b82f6' : 'transparent',
              color: platform === 'meta' ? 'white' : '#6b7280',
              border: platform === 'meta' ? '2px solid #2563eb' : '2px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            Meta Ads
          </button>
          <button
            disabled
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#d1d5db',
              border: '2px solid transparent',
              borderRadius: '6px',
              cursor: 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Google Ads <span style={{ fontSize: '0.7rem' }}>(Soon)</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Ad Account Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Ad account
            </label>
            <select
              value={selectedAdAccount}
              onChange={(e) => setSelectedAdAccount(e.target.value)}
              style={{
                padding: '0.5rem 2rem 0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                minWidth: '200px',
                color: '#1f2937',
              }}
            >
              <option value="">Select account</option>
              {adAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Selector (optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Campaign name
            </label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              disabled={!selectedAdAccount}
              style={{
                padding: '0.5rem 2rem 0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                minWidth: '200px',
                opacity: selectedAdAccount ? 1 : 0.5,
                color: '#1f2937',
              }}
            >
              <option value="">All campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.campaign_id} value={campaign.campaign_id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Date range
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#1f2937',
                }}
              />
              <span style={{ color: '#6b7280' }}>-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#1f2937',
                }}
              />
            </div>
          </div>

          {/* Load Button */}
          <div style={{ marginTop: 'auto' }}>
            <button
              onClick={handleLoadData}
              disabled={!selectedAdAccount || !startDate || !endDate || loading}
              style={{
                padding: '0.6rem 1.5rem',
                backgroundColor: selectedAdAccount && startDate && endDate ? '#3b82f6' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: selectedAdAccount && startDate && endDate ? 'pointer' : 'not-allowed',
                marginTop: '1.15rem',
              }}
            >
              {loading ? 'Loading...' : 'Load Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '3rem' }}>
          <LoadingSpinner message="Loading overview data..." />
        </div>
      )}

      {/* Main Content */}
      {!loading && currentMetrics && (
        <div style={{ padding: '1.5rem' }}>
          {/* Metrics Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Conversion Card */}
            <MetricCard
              title="Conversion"
              mainMetric={{
                label: 'Meta Ads Purchases',
                value: currentMetrics.purchases,
                format: 'number',
                change: getPercentageChange(currentMetrics.purchases, previousMetrics?.purchases || 0),
              }}
              subMetrics={[
                {
                  label: 'Amount spent',
                  value: currentMetrics.spend,
                  format: 'currency',
                  currency,
                  change: getPercentageChange(currentMetrics.spend, previousMetrics?.spend || 0),
                },
                {
                  label: 'CPA',
                  value: currentMetrics.cpa,
                  format: 'number',
                  decimals: 1,
                  change: getPercentageChange(currentMetrics.cpa, previousMetrics?.cpa || 0),
                },
                {
                  label: 'ROAS',
                  value: currentMetrics.roas,
                  format: 'percentage',
                  suffix: '%',
                  change: getPercentageChange(currentMetrics.roas, previousMetrics?.roas || 0),
                },
              ]}
              chartData={dailyData}
              chartKey="purchases"
              chartColor="#9333ea"
            />

            {/* Engagement Card */}
            <MetricCard
              title="Engagement"
              mainMetric={{
                label: 'Meta Ads Link clicks',
                value: currentMetrics.clicks,
                format: 'number',
                change: getPercentageChange(currentMetrics.clicks, previousMetrics?.clicks || 0),
              }}
              subMetrics={[
                {
                  label: 'CTR',
                  value: currentMetrics.ctr,
                  format: 'percentage',
                  decimals: 2,
                  suffix: '%',
                  change: getPercentageChange(currentMetrics.ctr, previousMetrics?.ctr || 0),
                },
                {
                  label: 'CPC',
                  value: currentMetrics.cpc,
                  format: 'number',
                  decimals: 2,
                  change: getPercentageChange(currentMetrics.cpc, previousMetrics?.cpc || 0),
                },
              ]}
              chartData={dailyData}
              chartKey="clicks"
              chartColor="#0ea5e9"
            />

            {/* Visibility Card */}
            <MetricCard
              title="Visibility"
              mainMetric={{
                label: 'Meta Ads Impressions',
                value: currentMetrics.impressions,
                format: 'number',
                change: getPercentageChange(currentMetrics.impressions, previousMetrics?.impressions || 0),
              }}
              subMetrics={[
                {
                  label: 'Meta Ads Reach',
                  value: currentMetrics.reach,
                  format: 'number',
                  change: getPercentageChange(currentMetrics.reach, previousMetrics?.reach || 0),
                },
                {
                  label: 'CPM',
                  value: currentMetrics.cpm,
                  format: 'number',
                  decimals: 2,
                  change: getPercentageChange(currentMetrics.cpm, previousMetrics?.cpm || 0),
                },
              ]}
              chartData={dailyData}
              chartKey="impressions"
              chartColor="#3b82f6"
            />
          </div>

          {/* Top Campaigns Table */}
          {topCampaigns.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Campaigns</h3>
              <TopCampaignsTable campaigns={topCampaigns} />
            </div>
          )}

          {/* Hierarchical Table */}
          {hierarchicalData.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <HierarchicalTable data={hierarchicalData} />
            </div>
          )}

          {/* Top Creatives */}
          {topCreatives.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Top creatives</h3>
              <TopCreativesTable creatives={topCreatives} currency={currency} />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !currentMetrics && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#9ca3af',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#6b7280' }}>
            Select filters and click Load Data
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Choose an ad account and date range to view the overview
          </p>
        </div>
      )}
    </div>
  )
}

// MetricCard Component
interface MetricCardProps {
  title: string
  mainMetric: {
    label: string
    value: number
    format: 'number' | 'currency' | 'percentage'
    currency?: string
    decimals?: number
    suffix?: string
    change: number
  }
  subMetrics: Array<{
    label: string
    value: number
    format: 'number' | 'currency' | 'percentage'
    currency?: string
    decimals?: number
    suffix?: string
    change: number
  }>
  chartData: any[]
  chartKey: string
  chartColor: string
}

function MetricCard({ title, mainMetric, subMetrics, chartData, chartKey, chartColor }: MetricCardProps) {
  const formatValue = (value: number, format: string, decimals = 0, currency = 'USD', suffix = '') => {
    if (format === 'currency') {
      return formatCurrency(value, currency)
    } else if (format === 'number') {
      return value.toLocaleString('en-US', { maximumFractionDigits: decimals })
    } else if (format === 'percentage') {
      return value.toFixed(decimals) + suffix
    }
    return value.toString()
  }

  const maxValue = Math.max(...chartData.map(d => d[chartKey] || 0), 1)

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>
        {title}
      </h3>

      {/* Main Metric */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
          {mainMetric.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937' }}>
            {formatValue(mainMetric.value, mainMetric.format, mainMetric.decimals, mainMetric.currency, mainMetric.suffix)}
          </span>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: mainMetric.change >= 0 ? '#10b981' : '#ef4444',
          }}>
            {mainMetric.change >= 0 ? '▲' : '▼'} {Math.abs(mainMetric.change).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        height: '100px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4px',
        marginBottom: '1rem',
        padding: '0 4px',
      }}>
        {chartData.length > 0 ? (
          chartData.map((day, idx) => {
            const value = day[chartKey] || 0
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0
            const barWidth = chartData.length > 0 ? `${100 / chartData.length}%` : '100%'

            return (
              <div
                key={idx}
                style={{
                  width: barWidth,
                  maxWidth: '40px',
                  height: `${height}%`,
                  backgroundColor: chartColor,
                  borderRadius: '3px 3px 0 0',
                  minHeight: value > 0 ? '3px' : '0',
                  transition: 'height 0.3s',
                }}
                title={`${day.date}: ${value.toLocaleString()}`}
              />
            )
          })
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: '0.75rem',
          }}>
            No data
          </div>
        )}
      </div>

      {/* Sub Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${subMetrics.length}, 1fr)`, gap: '1rem' }}>
        {subMetrics.map((metric, idx) => (
          <div key={idx}>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              {metric.label}
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>
              {formatValue(metric.value, metric.format, metric.decimals, metric.currency, metric.suffix)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: metric.change >= 0 ? '#10b981' : '#ef4444',
            }}>
              {metric.change >= 0 ? '▲' : '▼'} {Math.abs(metric.change).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// HierarchicalTable Component
interface HierarchicalTableProps {
  data: any[]
}

function HierarchicalTable({ data }: HierarchicalTableProps) {
  const [selectedObjective, setSelectedObjective] = useState<string>('all')

  // Get max values for bar scaling
  const allRows: any[] = []
  data.forEach(campaign => {
    allRows.push(campaign)
    campaign.adsets?.forEach((adset: any) => {
      allRows.push(adset)
      adset.ads?.forEach((ad: any) => {
        allRows.push(ad)
      })
    })
  })

  const maxCTR = Math.max(...allRows.map(r => r.ctr || 0), 1)
  const maxClicks = Math.max(...allRows.map(r => r.clicks || 0), 1)
  const maxImpressions = Math.max(...allRows.map(r => r.impressions || 0), 1)

  const getBarWidth = (value: number, max: number) => {
    return max > 0 ? (value / max) * 100 : 0
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: '#1f2937' }}>
          Campaigns, adsets, and ads
        </h3>
        <select
          value={selectedObjective}
          onChange={(e) => setSelectedObjective(e.target.value)}
          style={{
            padding: '0.5rem 2rem 0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
          }}
        >
          <option value="all">Meta Ads Objective</option>
          <option value="awareness">Awareness</option>
          <option value="consideration">Consideration</option>
          <option value="conversion">Conversion</option>
        </select>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '20%' }}>
                Meta Ads Campaign name
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '20%' }}>
                Meta Ads Adset name
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '20%' }}>
                Meta Ads Ad name
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '13%' }}>
                Meta Ads CTR (Link cli...
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '13%' }}>
                Meta Ads Link clicks
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '14%' }}>
                Meta Ads Impressions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((campaign, cIdx) => (
              <>
                {/* Campaign Row */}
                <tr key={`c-${cIdx}`} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>
                    {campaign.name}
                  </td>
                  <td style={{ padding: '0.75rem' }}></td>
                  <td style={{ padding: '0.75rem' }}></td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', minWidth: '50px', color: '#1f2937' }}>
                        {(campaign.ctr || 0).toFixed(2)}%
                      </span>
                      <div style={{ flex: 1, height: '20px', backgroundColor: '#e0f2fe', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${getBarWidth(campaign.ctr || 0, maxCTR)}%`,
                          backgroundColor: '#0ea5e9',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', minWidth: '50px', color: '#1f2937' }}>
                        {(campaign.clicks || 0).toLocaleString()}
                      </span>
                      <div style={{ flex: 1, height: '20px', backgroundColor: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${getBarWidth(campaign.clicks || 0, maxClicks)}%`,
                          backgroundColor: '#22c55e',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', minWidth: '50px', color: '#1f2937' }}>
                        {(campaign.impressions || 0).toLocaleString()}
                      </span>
                      <div style={{ flex: 1, height: '20px', backgroundColor: '#f3e8ff', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${getBarWidth(campaign.impressions || 0, maxImpressions)}%`,
                          backgroundColor: '#a855f7',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Adsets for this campaign */}
                {campaign.adsets?.map((adset: any, aIdx: number) => (
                  <>
                    <tr key={`a-${cIdx}-${aIdx}`} style={{ borderTop: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}>
                      <td style={{ padding: '0.75rem' }}></td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', paddingLeft: '1.5rem', color: '#1f2937' }}>
                        {adset.name}
                      </td>
                      <td style={{ padding: '0.75rem' }}></td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', minWidth: '50px', color: '#1f2937' }}>
                            {(adset.ctr || 0).toFixed(2)}%
                          </span>
                          <div style={{ flex: 1, height: '16px', backgroundColor: '#e0f2fe', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${getBarWidth(adset.ctr || 0, maxCTR)}%`,
                              backgroundColor: '#0ea5e9',
                            }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', minWidth: '50px', color: '#1f2937' }}>
                            {(adset.clicks || 0).toLocaleString()}
                          </span>
                          <div style={{ flex: 1, height: '16px', backgroundColor: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${getBarWidth(adset.clicks || 0, maxClicks)}%`,
                              backgroundColor: '#22c55e',
                            }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', minWidth: '50px', color: '#1f2937' }}>
                            {(adset.impressions || 0).toLocaleString()}
                          </span>
                          <div style={{ flex: 1, height: '16px', backgroundColor: '#f3e8ff', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${getBarWidth(adset.impressions || 0, maxImpressions)}%`,
                              backgroundColor: '#a855f7',
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Ads for this adset */}
                    {adset.ads?.map((ad: any, adIdx: number) => (
                      <tr key={`ad-${cIdx}-${aIdx}-${adIdx}`} style={{ borderTop: '1px solid #f9fafb', backgroundColor: '#fcfcfc' }}>
                        <td style={{ padding: '0.75rem' }}></td>
                        <td style={{ padding: '0.75rem' }}></td>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', paddingLeft: '2rem', color: '#1f2937' }}>
                          {ad.name}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', minWidth: '50px', color: '#1f2937' }}>
                              {(ad.ctr || 0).toFixed(2)}%
                            </span>
                            <div style={{ flex: 1, height: '12px', backgroundColor: '#e0f2fe', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${getBarWidth(ad.ctr || 0, maxCTR)}%`,
                                backgroundColor: '#0ea5e9',
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', minWidth: '50px', color: '#1f2937' }}>
                              {(ad.clicks || 0).toLocaleString()}
                            </span>
                            <div style={{ flex: 1, height: '12px', backgroundColor: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${getBarWidth(ad.clicks || 0, maxClicks)}%`,
                                backgroundColor: '#22c55e',
                              }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', minWidth: '50px', color: '#1f2937' }}>
                              {(ad.impressions || 0).toLocaleString()}
                            </span>
                            <div style={{ flex: 1, height: '12px', backgroundColor: '#f3e8ff', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${getBarWidth(ad.impressions || 0, maxImpressions)}%`,
                                backgroundColor: '#a855f7',
                              }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </>
            ))}
          </tbody>
        </table>

        {/* Pagination placeholder */}
        <div style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          color: '#6b7280',
        }}>
          <span>1 - 4 / 4</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}>
              ‹
            </button>
            <button style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}>
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// TopCampaignsTable Component
interface TopCampaignsTableProps {
  campaigns: any[]
}

function TopCampaignsTable({ campaigns }: TopCampaignsTableProps) {
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0)
  const totalCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  const getCTRColor = (ctr: number) => {
    if (ctr >= 30) return 'rgba(34, 197, 94, 0.3)' // green
    if (ctr >= 10) return 'rgba(34, 197, 94, 0.2)'
    if (ctr >= 5) return 'rgba(251, 191, 36, 0.2)' // yellow
    return 'rgba(239, 68, 68, 0.2)' // red
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f9fafb' }}>
          <tr>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>
              Meta Ads Campaign name
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>
              Meta Ads CTR (Link click-through rate)
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>
              Meta Ads Link clicks
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>
              Meta Ads Impressions
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign, idx) => (
            <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937' }}>
                {campaign.name}
              </td>
              <td style={{
                padding: '0.75rem',
                textAlign: 'right',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1f2937',
                backgroundColor: getCTRColor(campaign.ctr || 0),
              }}>
                {(campaign.ctr || 0).toFixed(2)}%
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
                {(campaign.clicks || 0).toLocaleString()}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
                {(campaign.impressions || 0).toLocaleString()}
              </td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid #1f2937', fontWeight: 600 }}>
            <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937' }}>
              Grand total
            </td>
            <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
              {totalCTR.toFixed(2)}%
            </td>
            <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
              {totalClicks.toLocaleString()}
            </td>
            <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
              {totalImpressions.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// TopCreativesTable Component
interface TopCreativesTableProps {
  creatives: any[]
  currency: string
}

function TopCreativesTable({ creatives, currency }: TopCreativesTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const totalPages = Math.ceil(creatives.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const currentCreatives = creatives.slice(startIdx, endIdx)

  const totalSpend = creatives.reduce((sum, c) => sum + (c.spend || 0), 0)
  const totalClicks = creatives.reduce((sum, c) => sum + (c.clicks || 0), 0)
  const totalImpressions = creatives.reduce((sum, c) => sum + (c.impressions || 0), 0)
  const totalCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  const getCTRGradient = (ctr: number) => {
    // Gradient from red (low) to yellow (medium) to green (high)
    if (ctr >= 15) return 'rgba(34, 197, 94, 0.3)' // green
    if (ctr >= 10) return 'rgba(34, 197, 94, 0.2)'
    if (ctr >= 5) return 'rgba(251, 191, 36, 0.2)' // yellow
    if (ctr >= 2) return 'rgba(251, 191, 36, 0.15)'
    return 'rgba(239, 68, 68, 0.2)' // red
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f9fafb' }}>
          <tr>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '10%' }}>
              Meta Ads Ad image
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '25%' }}>
              Meta Ads Ad title
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '15%' }}>
              Meta Ads Amount spent
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '15%' }}>
              Meta Ads CTR (Link cli...
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '15%' }}>
              Meta Ads Link clicks
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', width: '20%' }}>
              Meta Ads Impressions
            </th>
          </tr>
        </thead>
        <tbody>
          {currentCreatives.map((creative, idx) => (
            <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }}>
                {creative.creative_image ? (
                  <img
                    src={creative.creative_image}
                    alt={creative.creative_title}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  }}>
                    🖼️
                  </div>
                )}
              </td>
              <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937' }}>
                {creative.creative_title}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
                {formatCurrency(creative.spend || 0, currency)}
              </td>
              <td style={{
                padding: '0.75rem',
                textAlign: 'right',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1f2937',
                backgroundColor: getCTRGradient(creative.ctr || 0),
              }}>
                {(creative.ctr || 0).toFixed(2)}%
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
                {(creative.clicks || 0).toLocaleString()}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
                {(creative.impressions || 0).toLocaleString()}
              </td>
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid #1f2937', fontWeight: 600 }}>
            <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937' }} colSpan={2}>
              Grand total
            </td>
            <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
              {formatCurrency(totalSpend, currency)}
            </td>
            <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
              {totalCTR.toFixed(2)}%
            </td>
            <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
              {totalClicks.toLocaleString()}
            </td>
            <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#1f2937' }}>
              {totalImpressions.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.875rem',
        color: '#6b7280',
      }}>
        <span>
          {startIdx + 1} - {Math.min(endIdx, creatives.length)} / {creatives.length}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.25rem 0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
