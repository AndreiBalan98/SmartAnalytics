/**
 * Client Dashboard - NEW 3-Panel Layout
 * Left: Ad Accounts | Center: Data Display | Right: Navigation
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LeftPanel from '@/components/dashboard/LeftPanel'
import CenterPanel from '@/components/dashboard/CenterPanel'
import RightPanel from '@/components/dashboard/RightPanel'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

// Storage key for dashboard selections
const SELECTIONS_STORAGE_KEY = 'dashboard_selections'

interface SelectionItem {
  id: string
  name: string
  ad_account_id: string
}

interface DashboardSelections {
  campaigns: SelectionItem[]
  adSets: SelectionItem[]
  ads: SelectionItem[]
}

// Helper to load selections from localStorage
function loadSelections(): DashboardSelections {
  if (typeof window === 'undefined') {
    return { campaigns: [], adSets: [], ads: [] }
  }

  try {
    const stored = localStorage.getItem(SELECTIONS_STORAGE_KEY)
    if (!stored) return { campaigns: [], adSets: [], ads: [] }

    const parsed = JSON.parse(stored)
    return {
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : [],
      adSets: Array.isArray(parsed.adSets) ? parsed.adSets : [],
      ads: Array.isArray(parsed.ads) ? parsed.ads : [],
    }
  } catch (err) {
    console.error('Failed to load selections from localStorage:', err)
    return { campaigns: [], adSets: [], ads: [] }
  }
}

// Helper to save selections to localStorage
function saveSelections(selections: DashboardSelections): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(SELECTIONS_STORAGE_KEY, JSON.stringify(selections))
  } catch (err) {
    console.error('Failed to save selections to localStorage:', err)
  }
}

type Platform = 'meta' | 'google_ads' | 'ga4'

interface AdAccount {
  id: string
  name: string
  currency: string
  timezone: string
  account_status: number | string
  status_display: string
}

interface GA4Property {
  id: string
  property_id: string
  name: string
  timezone: string
  currency: string
  account_name?: string
}

export default function ClientDashboard() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()

  // State
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('meta')
  const [selectedTab, setSelectedTab] = useState<'overview' | 'platform' | 'leads'>('overview')
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState('campaigns')
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [googleAdAccounts, setGoogleAdAccounts] = useState<AdAccount[]>([])
  const [ga4Properties, setGa4Properties] = useState<GA4Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection state - initialize from localStorage
  const initialSelections = loadSelections()
  const [selectedCampaigns, setSelectedCampaigns] = useState<SelectionItem[]>(initialSelections.campaigns)
  const [selectedAdSets, setSelectedAdSets] = useState<SelectionItem[]>(initialSelections.adSets)
  const [selectedAds, setSelectedAds] = useState<SelectionItem[]>(initialSelections.ads)

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (!authLoading && user && user.user_type !== 'client' && user.user_type !== 'agency_client') {
      router.push('/')
    } else if (!authLoading && user && (user.user_type === 'client' || user.user_type === 'agency_client')) {
      loadAdAccounts()
    }
  }, [user, authLoading, router])

  async function loadAdAccounts() {
    setLoading(true)
    setError(null)

    try {
      // Load all platforms in parallel
      const [metaRes, googleRes, ga4Res] = await Promise.allSettled([
        api.getClientAdAccountsNew(),
        api.getClientGoogleAdsAccounts(),
        api.getClientGA4Properties(),
      ])

      const metaAccounts = metaRes.status === 'fulfilled' ? (metaRes.value.ad_accounts || []) : []
      const googleAccounts = googleRes.status === 'fulfilled' ? (googleRes.value.ad_accounts || []) : []
      const ga4Props = ga4Res.status === 'fulfilled' ? (ga4Res.value.properties || []) : []

      setAdAccounts(metaAccounts)
      setGoogleAdAccounts(googleAccounts)
      setGa4Properties(ga4Props)

      // Auto-select first account from whichever has data
      if (metaAccounts.length > 0) {
        setSelectedAccount(metaAccounts[0].id)
      } else if (googleAccounts.length > 0) {
        setSelectedAccount(googleAccounts[0].id)
        setSelectedPlatform('google_ads')
      } else if (ga4Props.length > 0) {
        setSelectedAccount(ga4Props[0].property_id)
        setSelectedPlatform('ga4')
      }
    } catch (err: any) {
      console.error('Failed to load ad accounts:', err)
      setError(err.message || 'Failed to load ad accounts')
    } finally {
      setLoading(false)
    }
  }

  // Save selections to localStorage whenever they change
  useEffect(() => {
    saveSelections({
      campaigns: selectedCampaigns,
      adSets: selectedAdSets,
      ads: selectedAds,
    })
  }, [selectedCampaigns, selectedAdSets, selectedAds])

  // Handler to clear all selections
  function handleClearAllSelections() {
    setSelectedCampaigns([])
    setSelectedAdSets([])
    setSelectedAds([])
    // No need to call saveSelections - useEffect will handle it
  }

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    )
  }

  if (!user || (user.user_type !== 'client' && user.user_type !== 'agency_client')) {
    return null
  }

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* PARTEA 1: Header - 10% înălțime cu min/max */}
      <header style={{
        height: 'clamp(60px, 10vh, 80px)',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1f2937',
            }}>
              Dashboard
            </h1>
            <p style={{
              margin: '0.25rem 0 0 0',
              fontSize: '0.75rem',
              color: '#6b7280',
            }}>
              {user.first_name} {user.last_name} • {user.email}
            </p>
          </div>

          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* PARTEA 2: Platform Tabs - 5% înălțime cu min/max */}
      <div style={{
        height: 'clamp(40px, 5vh, 60px)',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          height: '100%',
          alignItems: 'center',
        }}>
          <button
            onClick={() => setSelectedTab('overview')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedTab === 'overview' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'overview' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedTab === 'overview' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              height: '100%',
            }}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setSelectedTab('platform')
              setSelectedPlatform('meta')
              setSelectedView('campaigns')
              if (adAccounts.length > 0) setSelectedAccount(adAccounts[0].id)
              else setSelectedAccount(null)
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedTab === 'platform' && selectedPlatform === 'meta' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'platform' && selectedPlatform === 'meta' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedTab === 'platform' && selectedPlatform === 'meta' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              height: '100%',
            }}
          >
            Meta Ads
          </button>
          <button
            onClick={() => {
              setSelectedTab('platform')
              setSelectedPlatform('google_ads')
              setSelectedView('campaigns')
              if (googleAdAccounts.length > 0) setSelectedAccount(googleAdAccounts[0].id)
              else setSelectedAccount(null)
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedTab === 'platform' && selectedPlatform === 'google_ads' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'platform' && selectedPlatform === 'google_ads' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedTab === 'platform' && selectedPlatform === 'google_ads' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              height: '100%',
            }}
          >
            Google Ads
          </button>
          <button
            onClick={() => {
              setSelectedTab('platform')
              setSelectedPlatform('ga4')
              setSelectedView('insights')
              if (ga4Properties.length > 0) setSelectedAccount(ga4Properties[0].property_id)
              else setSelectedAccount(null)
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedTab === 'platform' && selectedPlatform === 'ga4' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'platform' && selectedPlatform === 'ga4' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedTab === 'platform' && selectedPlatform === 'ga4' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              height: '100%',
            }}
          >
            GA4
          </button>
          <button
            onClick={() => {
              setSelectedTab('leads')
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedTab === 'leads' ? '#3b82f6' : 'transparent',
              color: selectedTab === 'leads' ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: selectedTab === 'leads' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 0.2s',
              height: '100%',
            }}
          >
            Leads
          </button>
        </div>
      </div>

      {/* Error Message (if any) */}
      {error && (
        <div style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {/* PARTEA 3: Trei Panele - 85% (restul înălțimii) */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Left Panel - 12.5% cu min 220px, max 300px - only on platform tab */}
        {selectedTab === 'platform' && (
          <div style={{
            width: '12.5%',
            minWidth: '220px',
            maxWidth: '300px',
            backgroundColor: 'white',
            borderRight: '1px solid #e5e7eb',
          }}>
            <LeftPanel
              accounts={
                selectedPlatform === 'google_ads'
                  ? googleAdAccounts
                  : selectedPlatform === 'ga4'
                    ? ga4Properties.map(p => ({
                        id: p.property_id,
                        name: p.name,
                        currency: p.currency || '',
                        timezone: p.timezone || '',
                        account_status: 1,
                        status_display: 'Active',
                      }))
                    : adAccounts
              }
              selectedAccount={selectedAccount}
              onSelectAccount={setSelectedAccount}
              loading={loading}
              platform={selectedPlatform}
            />
          </div>
        )}

        {/* Center Panel - 75% (flex: 1 ia spațiul rămas) */}
        <div style={{
          flex: 1,
          backgroundColor: '#f9fafb',
        }}>
          <CenterPanel
            view={selectedTab === 'overview' ? 'overview' : selectedTab === 'leads' ? 'leads' : selectedView}
            accountId={selectedAccount}
            selectedCampaigns={selectedCampaigns}
            onSelectCampaigns={setSelectedCampaigns}
            selectedAdSets={selectedAdSets}
            onSelectAdSets={setSelectedAdSets}
            selectedAds={selectedAds}
            onSelectAds={setSelectedAds}
            adAccounts={adAccounts}
            platform={selectedPlatform}
          />
        </div>

        {/* Right Panel - 12.5% cu min 200px, max 280px - hidden on overview */}
        {selectedTab === 'platform' && (
          <div style={{
            width: '12.5%',
            minWidth: '200px',
            maxWidth: '280px',
            backgroundColor: 'white',
            borderLeft: '1px solid #e5e7eb',
          }}>
            <RightPanel
              selectedView={selectedView}
              onSelectView={setSelectedView}
              disabled={!selectedAccount}
              selectedCampaignsCount={selectedCampaigns.length}
              selectedAdSetsCount={selectedAdSets.length}
              selectedAdsCount={selectedAds.length}
              selectedAccountsCount={new Set(
                [...selectedCampaigns, ...selectedAdSets, ...selectedAds].map(item => item.ad_account_id)
              ).size}
              onClearAllSelections={handleClearAllSelections}
              platform={selectedPlatform}
            />
          </div>
        )}
      </div>
    </div>
  )
}
