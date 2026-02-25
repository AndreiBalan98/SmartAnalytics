'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { connectMeta, connectGoogleAds, connectGA4, OAuthConnectionStatus } from '@/lib/oauth'
import DarkModeToggle from '@/components/DarkModeToggle'

interface Client {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: string
  is_active: boolean
  date_joined: string
  permissions: {
    meta_accounts_ids: string[]
    google_accounts_ids: string[]
    ga4_properties_ids: string[]
    meta_form_ids: string[]
  }
}

interface OAuthConnections {
  meta: OAuthConnectionStatus
  google_ads: OAuthConnectionStatus
  ga4: OAuthConnectionStatus
}

interface AdAccount {
  account_id: string
  name: string
  currency: string
  status: string
}

interface GA4PropertyItem {
  property_id: string
  name: string
  timezone: string
  currency: string
}

interface MetaPageItem {
  page_id: string
  name: string
}

interface MetaLeadFormItem {
  form_id: string
  name: string
  status: string
  page_id: string
  page_name: string
}

export default function AgencyDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout, darkMode } = useAuth()

  // State
  const [clients, setClients] = useState<Client[]>([])
  const [oauthConnections, setOauthConnections] = useState<OAuthConnections | null>(null)
  const [metaAdAccounts, setMetaAdAccounts] = useState<AdAccount[]>([])
  const [googleAdAccounts, setGoogleAdAccounts] = useState<AdAccount[]>([])
  const [ga4Properties, setGa4Properties] = useState<GA4PropertyItem[]>([])
  const [metaPages, setMetaPages] = useState<MetaPageItem[]>([])
  const [metaLeadForms, setMetaLeadForms] = useState<MetaLeadFormItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sync state
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  // Modal states
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showStructuralSyncModal, setShowStructuralSyncModal] = useState(false)
  const [showInsightsSyncModal, setShowInsightsSyncModal] = useState(false)
  const [showGoogleStructuralSyncModal, setShowGoogleStructuralSyncModal] = useState(false)
  const [showGoogleInsightsSyncModal, setShowGoogleInsightsSyncModal] = useState(false)
  const [showGA4StructuralSyncModal, setShowGA4StructuralSyncModal] = useState(false)
  const [showGA4InsightsSyncModal, setShowGA4InsightsSyncModal] = useState(false)
  const [showLeadsStructuralSyncModal, setShowLeadsStructuralSyncModal] = useState(false)
  const [showLeadsSyncModal, setShowLeadsSyncModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)

  // Sync modal state
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [selectedGoogleAccountIds, setSelectedGoogleAccountIds] = useState<string[]>([])
  const [selectedGA4PropertyIds, setSelectedGA4PropertyIds] = useState<string[]>([])
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([])
  const [syncStartDate, setSyncStartDate] = useState('2026-01-01')
  const [syncEndDate, setSyncEndDate] = useState(new Date().toISOString().split('T')[0])

  // Form state
  const [clientForm, setClientForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (!authLoading && user && user.user_type !== 'agency') {
      router.push('/')
    } else if (!authLoading && user && user.user_type === 'agency') {
      loadDashboardData()
    }
  }, [user, authLoading, router])

  async function loadDashboardData() {
    setLoading(true)
    setError(null)

    try {
      const [clientsData, oauthData] = await Promise.all([
        api.listClients(),
        api.getOAuthStatus(),
      ])

      setClients(clientsData.clients || [])
      setOauthConnections(oauthData.oauth_connections)

      // If Meta is connected, load ad accounts, pages, and lead forms
      if (oauthData.oauth_connections?.meta?.connected) {
        try {
          const [adAccountsData, pagesData, formsData] = await Promise.allSettled([
            api.getAdAccounts(),
            api.getMetaPages(),
            api.getMetaLeadForms(),
          ])
          if (adAccountsData.status === 'fulfilled') setMetaAdAccounts(adAccountsData.value.accounts || [])
          if (pagesData.status === 'fulfilled') setMetaPages(pagesData.value.pages || [])
          if (formsData.status === 'fulfilled') setMetaLeadForms(formsData.value.forms || [])
        } catch (err) {
          console.error('Failed to load Meta data:', err)
        }
      }

      // If Google Ads is connected, load accounts
      if (oauthData.oauth_connections?.google_ads?.connected) {
        try {
          const googleData = await api.getGoogleAdsAccounts()
          setGoogleAdAccounts(googleData.accounts || [])
        } catch (err) {
          console.error('Failed to load Google Ads accounts:', err)
        }
      }

      // If GA4 is connected, load properties
      if (oauthData.oauth_connections?.ga4?.connected) {
        try {
          const ga4Data = await api.getGA4Properties()
          setGa4Properties(ga4Data.properties || [])
        } catch (err) {
          console.error('Failed to load GA4 properties:', err)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const response = await api.createClient(clientForm)

      if (response.temporary_password) {
        setNewPassword(response.temporary_password)
      }

      await loadDashboardData()
      setClientForm({ email: '', first_name: '', last_name: '' })

      if (!response.temporary_password) {
        setShowAddClientModal(false)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleUpdatePermissions(permissions: Record<string, any>) {
    if (!selectedClient) return

    try {
      await api.updateClientPermissions(selectedClient.id, permissions)
      setShowPermissionsModal(false)
      setSelectedClient(null)
      await loadDashboardData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleRemoveClient(clientId: number) {
    if (!confirm('Are you sure you want to remove this client?')) return

    try {
      await api.removeClient(clientId)
      await loadDashboardData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleConnectMeta() {
    try {
      const result = await connectMeta()
      if (result.success) {
        alert(`Meta connected successfully! Welcome, ${result.userName}`)
        loadDashboardData()
      } else {
        alert(`Failed to connect Meta: ${result.error}`)
      }
    } catch (error) {
      console.error('Meta connection error:', error)
      alert('Failed to connect Meta. Please try again.')
    }
  }

  async function handleConnectGoogleAds() {
    try {
      const result = await connectGoogleAds()
      if (result.success) {
        alert(`Google Ads connected successfully! Welcome, ${result.userName}`)
        loadDashboardData()
      } else {
        alert(`Failed to connect Google Ads: ${result.error}`)
      }
    } catch (error) {
      console.error('Google Ads connection error:', error)
      alert('Failed to connect Google Ads. Please try again.')
    }
  }

  async function handleConnectGA4() {
    try {
      const result = await connectGA4()
      if (result.success) {
        alert(`GA4 connected successfully! Welcome, ${result.userName}`)
        loadDashboardData()
      } else {
        alert(`Failed to connect GA4: ${result.error}`)
      }
    } catch (error) {
      console.error('GA4 connection error:', error)
      alert('Failed to connect GA4. Please try again.')
    }
  }

  async function handleStructuralSync() {
    if (selectedAccountIds.length === 0) {
      setError('Please select at least one ad account')
      return
    }

    setSyncLoading(true)
    setSyncResult(null)
    setError(null)

    try {
      const result = await api.triggerStructuralSync(selectedAccountIds)

      setSyncResult({
        message: 'Structural sync completed successfully!',
        structural: result.results,
      })
      setShowStructuralSyncModal(false)

      setTimeout(() => {
        setSyncResult(null)
      }, 10000)
    } catch (err: any) {
      setError(err.message || 'Failed to sync structural data')
    } finally {
      setSyncLoading(false)
    }
  }

  async function handleInsightsSync() {
    if (selectedAccountIds.length === 0) {
      setError('Please select at least one ad account')
      return
    }

    setSyncLoading(true)
    setSyncResult(null)
    setError(null)

    try {
      const result = await api.triggerInsightsSync({
        account_ids: selectedAccountIds,
        start_date: syncStartDate,
        end_date: syncEndDate,
      })

      setSyncResult({
        message: 'Insights sync completed successfully!',
        insights: result,
      })
      setShowInsightsSyncModal(false)

      setTimeout(() => {
        setSyncResult(null)
      }, 10000)
    } catch (err: any) {
      setError(err.message || 'Failed to sync insights')
    } finally {
      setSyncLoading(false)
    }
  }

  // Google Ads sync handlers
  async function handleGoogleStructuralSync() {
    if (selectedGoogleAccountIds.length === 0) {
      setError('Please select at least one Google Ads account')
      return
    }
    setSyncLoading(true)
    setSyncResult(null)
    setError(null)
    try {
      const result = await api.triggerGoogleAdsStructuralSync(selectedGoogleAccountIds)
      setSyncResult({ message: 'Google Ads structural sync completed!', structural: result.results })
      setShowGoogleStructuralSyncModal(false)
      setTimeout(() => setSyncResult(null), 10000)
    } catch (err: any) {
      setError(err.message || 'Failed to sync Google Ads structural data')
    } finally {
      setSyncLoading(false)
    }
  }

  async function handleGoogleInsightsSync() {
    if (selectedGoogleAccountIds.length === 0) {
      setError('Please select at least one Google Ads account')
      return
    }
    setSyncLoading(true)
    setSyncResult(null)
    setError(null)
    try {
      const result = await api.triggerGoogleAdsInsightsSync({
        account_ids: selectedGoogleAccountIds,
        start_date: syncStartDate,
        end_date: syncEndDate,
      })
      setSyncResult({ message: 'Google Ads insights sync completed!', insights: result })
      setShowGoogleInsightsSyncModal(false)
      setTimeout(() => setSyncResult(null), 10000)
    } catch (err: any) {
      setError(err.message || 'Failed to sync Google Ads insights')
    } finally {
      setSyncLoading(false)
    }
  }

  // GA4 sync handlers
  async function handleGA4StructuralSync() {
    setSyncLoading(true)
    setSyncResult(null)
    setError(null)
    try {
      const result = await api.triggerGA4StructuralSync()
      setSyncResult({ message: 'GA4 structural sync completed!', structural: result.results })
      setShowGA4StructuralSyncModal(false)
      setTimeout(() => setSyncResult(null), 10000)
      await loadDashboardData()
    } catch (err: any) {
      setError(err.message || 'Failed to sync GA4 structural data')
    } finally {
      setSyncLoading(false)
    }
  }

  async function handleGA4InsightsSync() {
    if (selectedGA4PropertyIds.length === 0) {
      setError('Please select at least one GA4 property')
      return
    }
    setSyncLoading(true)
    setSyncResult(null)
    setError(null)
    try {
      const result = await api.triggerGA4InsightsSync({
        property_ids: selectedGA4PropertyIds,
        start_date: syncStartDate,
        end_date: syncEndDate,
      })
      setSyncResult({ message: 'GA4 insights sync completed!', insights: result })
      setShowGA4InsightsSyncModal(false)
      setTimeout(() => setSyncResult(null), 10000)
    } catch (err: any) {
      setError(err.message || 'Failed to sync GA4 insights')
    } finally {
      setSyncLoading(false)
    }
  }

  function handleToggleAccount(accountId: string) {
    setSelectedAccountIds(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  function handleSelectAllAccounts() {
    if (selectedAccountIds.length === metaAdAccounts.length) {
      setSelectedAccountIds([])
    } else {
      setSelectedAccountIds(metaAdAccounts.map(acc => acc.account_id))
    }
  }

  function handleToggleGoogleAccount(accountId: string) {
    setSelectedGoogleAccountIds(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  function handleSelectAllGoogleAccounts() {
    if (selectedGoogleAccountIds.length === googleAdAccounts.length) {
      setSelectedGoogleAccountIds([])
    } else {
      setSelectedGoogleAccountIds(googleAdAccounts.map(acc => acc.account_id))
    }
  }

  function handleToggleGA4Property(propertyId: string) {
    setSelectedGA4PropertyIds(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  function handleSelectAllGA4Properties() {
    if (selectedGA4PropertyIds.length === ga4Properties.length) {
      setSelectedGA4PropertyIds([])
    } else {
      setSelectedGA4PropertyIds(ga4Properties.map(p => p.property_id))
    }
  }

  // Lead Ads sync handlers
  async function handleLeadsStructuralSync() {
    if (selectedPageIds.length === 0) {
      setError('Please select at least one page')
      return
    }
    setSyncLoading(true)
    setSyncResult(null)
    setError(null)
    try {
      const result = await api.triggerLeadsStructuralSync(selectedPageIds)
      setSyncResult({ message: 'Leads structural sync completed!', structural: result.results })
      setShowLeadsStructuralSyncModal(false)
      setSelectedPageIds([])
      setTimeout(() => setSyncResult(null), 10000)
      await loadDashboardData()
    } catch (err: any) {
      setError(err.message || 'Failed to sync lead forms')
    } finally {
      setSyncLoading(false)
    }
  }

  async function handleLeadsSync() {
    if (selectedFormIds.length === 0) {
      setError('Please select at least one form')
      return
    }
    setSyncLoading(true)
    setSyncResult(null)
    setError(null)
    try {
      const result = await api.triggerLeadsSync(selectedFormIds)
      setSyncResult({ message: 'Leads sync completed!', structural: result.results })
      setShowLeadsSyncModal(false)
      setSelectedFormIds([])
      setTimeout(() => setSyncResult(null), 10000)
    } catch (err: any) {
      setError(err.message || 'Failed to sync leads')
    } finally {
      setSyncLoading(false)
    }
  }

  function handleTogglePage(pageId: string) {
    setSelectedPageIds(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    )
  }

  function handleSelectAllPages() {
    if (selectedPageIds.length === metaPages.length) {
      setSelectedPageIds([])
    } else {
      setSelectedPageIds(metaPages.map(p => p.page_id))
    }
  }

  function handleToggleForm(formId: string) {
    setSelectedFormIds(prev =>
      prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    )
  }

  function handleSelectAllForms() {
    if (selectedFormIds.length === metaLeadForms.length) {
      setSelectedFormIds([])
    } else {
      setSelectedFormIds(metaLeadForms.map(f => f.form_id))
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: darkMode ? '#1a1a1a' : '#f8f9fa'
      }}>
        <p style={{ color: darkMode ? '#9ca3af' : '#666' }}>Loading dashboard...</p>
      </div>
    )
  }

  if (!user || user.user_type !== 'agency') {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: darkMode ? '#1a1a1a' : '#f8f9fa',
      transition: 'background-color 0.2s ease'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.75rem',
            color: darkMode ? '#f3f4f6' : '#000'
          }}>
            Agency Dashboard
          </h1>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: darkMode ? '#9ca3af' : '#666'
          }}>
            {user.agency_name || 'Your Agency'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <DarkModeToggle />
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: darkMode ? '#3f3f46' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Error Message */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: darkMode ? '#3f1e1e' : '#fee',
            borderRadius: '8px',
            marginBottom: '2rem',
            color: darkMode ? '#fca5a5' : '#c00',
            border: darkMode ? '1px solid #7f1d1d' : 'none'
          }}>
            {error}
          </div>
        )}

        {/* Sync Success Message */}
        {syncResult && (
          <div style={{
            padding: '1rem',
            backgroundColor: darkMode ? '#1e3a1e' : '#d4edda',
            borderRadius: '8px',
            marginBottom: '2rem',
            color: darkMode ? '#86efac' : '#155724',
            border: darkMode ? '1px solid #166534' : 'none'
          }}>
            <strong>{syncResult.message || 'Sync Completed Successfully!'}</strong>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              {syncResult.structural && !syncResult.structural.skipped && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Structural Data:</strong>
                  <div style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                    {Object.entries(syncResult.structural).map(([accountId, data]: [string, any]) => {
                      if (accountId === 'skipped') return null
                      return (
                        <div key={accountId} style={{ marginTop: '0.5rem' }}>
                          <div style={{ fontWeight: '600' }}>Account {accountId}:</div>
                          {data.error ? (
                            <div style={{ color: '#dc2626', marginLeft: '1rem' }}>{data.error}</div>
                          ) : (
                            <div style={{ marginLeft: '1rem' }}>
                              {data.campaigns > 0 && <div>Campaigns: {data.campaigns}</div>}
                              {data.adsets > 0 && <div>Ad Sets: {data.adsets}</div>}
                              {data.ads > 0 && <div>Ads: {data.ads}</div>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {syncResult.structural?.skipped && (
                <div style={{ marginBottom: '0.75rem', color: darkMode ? '#9ca3af' : '#666' }}>
                  Structural sync skipped (all levels synced within 24h)
                </div>
              )}

              {syncResult.insights && (
                <div style={{ borderTop: darkMode ? '1px solid #166534' : '1px solid #c3e6cb', paddingTop: '0.75rem' }}>
                  <strong>Insights:</strong>
                  <div style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                    {syncResult.insights.total_insights !== undefined ? (
                      <div>Total insights synced: {syncResult.insights.total_insights}</div>
                    ) : (
                      <div>Sync completed</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Platform Integrations Section */}
        <div style={{
          backgroundColor: darkMode ? '#27272a' : 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          border: darkMode ? '1px solid #3f3f46' : 'none'
        }}>
          <h2 style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1.25rem',
            color: darkMode ? '#f3f4f6' : '#000'
          }}>
            Platform Integrations
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Meta Ads */}
            <div style={{
              padding: '1rem',
              border: darkMode ? '2px solid #3f3f46' : '2px solid #ddd',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              backgroundColor: darkMode ? '#1f1f23' : 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: darkMode ? '#f3f4f6' : '#000' }}>Meta Ads</strong>
              </div>
              {oauthConnections?.meta?.connected ? (
                <>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    color: '#155724',
                    fontSize: '0.875rem'
                  }}>
                    Connected
                    {oauthConnections.meta.name && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {oauthConnections.meta.name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowStructuralSyncModal(true)}
                    disabled={syncLoading}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: syncLoading ? '#ccc' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    {syncLoading ? 'Syncing...' : 'Structural Sync'}
                  </button>
                  <button
                    onClick={() => setShowInsightsSyncModal(true)}
                    disabled={syncLoading}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: syncLoading ? '#ccc' : '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    {syncLoading ? 'Syncing...' : 'Insights Sync'}
                  </button>
                  <button
                    onClick={() => setShowLeadsStructuralSyncModal(true)}
                    disabled={syncLoading}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: syncLoading ? '#ccc' : '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    {syncLoading ? 'Syncing...' : 'Leads Form Sync'}
                  </button>
                  <button
                    onClick={() => setShowLeadsSyncModal(true)}
                    disabled={syncLoading}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: syncLoading ? '#ccc' : '#ec4899',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    {syncLoading ? 'Syncing...' : 'Leads Sync'}
                  </button>
                  <button
                    onClick={handleConnectMeta}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Reconnect
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: '#f8d7da',
                    borderRadius: '4px',
                    color: '#721c24',
                    fontSize: '0.875rem'
                  }}>
                    Not Connected
                  </div>
                  <button
                    onClick={handleConnectMeta}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#1877f2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    Connect Meta
                  </button>
                </>
              )}
            </div>

            {/* Google Ads */}
            <div style={{
              padding: '1rem',
              border: darkMode ? '2px solid #3f3f46' : '2px solid #ddd',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              backgroundColor: darkMode ? '#1f1f23' : 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: darkMode ? '#f3f4f6' : '#000' }}>Google Ads</strong>
              </div>
              {oauthConnections?.google_ads?.connected ? (
                <>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    color: '#155724',
                    fontSize: '0.875rem'
                  }}>
                    Connected
                    {oauthConnections.google_ads.name && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {oauthConnections.google_ads.name}
                      </div>
                    )}
                    {googleAdAccounts.length > 0 && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {googleAdAccounts.length} account{googleAdAccounts.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowGoogleStructuralSyncModal(true)}
                    disabled={syncLoading}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: syncLoading ? '#ccc' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    {syncLoading ? 'Syncing...' : 'Structural Sync'}
                  </button>
                  <button
                    onClick={() => setShowGoogleInsightsSyncModal(true)}
                    disabled={syncLoading}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: syncLoading ? '#ccc' : '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    {syncLoading ? 'Syncing...' : 'Insights Sync'}
                  </button>
                  <button
                    onClick={handleConnectGoogleAds}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Reconnect
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: '#f8d7da',
                    borderRadius: '4px',
                    color: '#721c24',
                    fontSize: '0.875rem'
                  }}>
                    Not Connected
                  </div>
                  <button
                    onClick={handleConnectGoogleAds}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#1a73e8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    Connect Google Ads
                  </button>
                </>
              )}
            </div>

            {/* GA4 */}
            <div style={{
              padding: '1rem',
              border: darkMode ? '2px solid #3f3f46' : '2px solid #ddd',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              backgroundColor: darkMode ? '#1f1f23' : 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: darkMode ? '#f3f4f6' : '#000' }}>Google Analytics 4</strong>
              </div>
              {oauthConnections?.ga4?.connected ? (
                <>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    color: '#155724',
                    fontSize: '0.875rem'
                  }}>
                    Connected
                    {oauthConnections.ga4.name && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {oauthConnections.ga4.name}
                      </div>
                    )}
                    {ga4Properties.length > 0 && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {ga4Properties.length} propert{ga4Properties.length !== 1 ? 'ies' : 'y'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleGA4StructuralSync()}
                    disabled={syncLoading}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: syncLoading ? '#ccc' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    {syncLoading ? 'Syncing...' : 'Sync Properties'}
                  </button>
                  <button
                    onClick={() => setShowGA4InsightsSyncModal(true)}
                    disabled={syncLoading}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: syncLoading ? '#ccc' : '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: syncLoading ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    {syncLoading ? 'Syncing...' : 'Insights Sync'}
                  </button>
                  <button
                    onClick={handleConnectGA4}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Reconnect
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: '#f8d7da',
                    borderRadius: '4px',
                    color: '#721c24',
                    fontSize: '0.875rem'
                  }}>
                    Not Connected
                  </div>
                  <button
                    onClick={handleConnectGA4}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#e37400',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}
                  >
                    Connect GA4
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Clients Section */}
        <div style={{
          backgroundColor: darkMode ? '#27272a' : 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          border: darkMode ? '1px solid #3f3f46' : 'none'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.25rem',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Clients ({clients.length})
            </h2>
            <button
              onClick={() => setShowAddClientModal(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0051cc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
            >
              + Add Client
            </button>
          </div>

          {clients.length === 0 ? (
            <p style={{
              color: darkMode ? '#9ca3af' : '#666',
              textAlign: 'center',
              padding: '2rem'
            }}>
              No clients yet. Click "Add Client" to get started.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    borderBottom: darkMode ? '2px solid #3f3f46' : '2px solid #ddd'
                  }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: darkMode ? '#f3f4f6' : '#000' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: darkMode ? '#f3f4f6' : '#000' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: darkMode ? '#f3f4f6' : '#000' }}>Permissions</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: darkMode ? '#f3f4f6' : '#000' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', color: darkMode ? '#f3f4f6' : '#000' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} style={{
                      borderBottom: darkMode ? '1px solid #3f3f46' : '1px solid #eee'
                    }}>
                      <td style={{
                        padding: '0.75rem',
                        color: darkMode ? '#f3f4f6' : '#000'
                      }}>
                        {client.first_name} {client.last_name}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        color: darkMode ? '#9ca3af' : '#000'
                      }}>{client.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {client.permissions?.meta_accounts_ids?.length > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: darkMode ? '#1e3a5f' : '#e7f3ff',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: darkMode ? '#93c5fd' : '#0369a1'
                            }}>
                              Meta ({client.permissions.meta_accounts_ids.length})
                            </span>
                          )}
                          {client.permissions?.google_accounts_ids?.length > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: darkMode ? '#3f2e1e' : '#fff3e0',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: darkMode ? '#fbbf24' : '#b45309'
                            }}>
                              Google ({client.permissions.google_accounts_ids.length})
                            </span>
                          )}
                          {client.permissions?.ga4_properties_ids?.length > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: darkMode ? '#2e1e3f' : '#f3e8ff',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: darkMode ? '#c084fc' : '#7c3aed'
                            }}>
                              GA4 ({client.permissions.ga4_properties_ids.length})
                            </span>
                          )}
                          {client.permissions?.meta_form_ids?.length > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: darkMode ? '#3f1e2e' : '#fce7f3',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: darkMode ? '#f472b6' : '#be185d'
                            }}>
                              Leads ({client.permissions.meta_form_ids.length})
                            </span>
                          )}
                          {(!client.permissions?.meta_accounts_ids?.length) &&
                           (!client.permissions?.google_accounts_ids?.length) &&
                           (!client.permissions?.ga4_properties_ids?.length) &&
                           (!client.permissions?.meta_form_ids?.length) && (
                            <span style={{
                              color: darkMode ? '#6b7280' : '#999',
                              fontSize: '0.875rem'
                            }}>None</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: client.is_active
                            ? (darkMode ? '#1e3a1e' : '#d4edda')
                            : (darkMode ? '#3f1e1e' : '#f8d7da'),
                          color: client.is_active
                            ? (darkMode ? '#86efac' : '#155724')
                            : (darkMode ? '#fca5a5' : '#721c24'),
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}>
                          {client.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedClient(client)
                              setShowPermissionsModal(true)
                            }}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#0070f3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0051cc'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
                          >
                            Permissions
                          </button>
                          <button
                            onClick={() => handleRemoveClient(client.id)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b02a37'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: darkMode ? '#27272a' : 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: darkMode ? '1px solid #3f3f46' : 'none',
            boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>Add New Client</h3>

            {newPassword ? (
              <div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: darkMode ? '#1e3a1e' : '#d4edda',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: darkMode ? '1px solid #166534' : 'none'
                }}>
                  <p style={{
                    margin: '0 0 0.5rem 0',
                    fontWeight: '600',
                    color: darkMode ? '#86efac' : '#155724'
                  }}>
                    Client created successfully!
                  </p>
                  <p style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.875rem',
                    color: darkMode ? '#86efac' : '#155724'
                  }}>
                    Temporary Password:
                  </p>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: darkMode ? '#1f1f23' : 'white',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    wordBreak: 'break-all',
                    color: darkMode ? '#f3f4f6' : '#000',
                    border: darkMode ? '1px solid #3f3f46' : 'none'
                  }}>
                    {newPassword}
                  </div>
                  <p style={{
                    margin: '0.5rem 0 0 0',
                    fontSize: '0.875rem',
                    color: darkMode ? '#fbbf24' : '#856404'
                  }}>
                    Copy this password and send it to the client securely. It won't be shown again.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddClientModal(false)
                    setNewPassword(null)
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0051cc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddClient}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: darkMode ? '#f3f4f6' : '#000'
                  }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                      boxSizing: 'border-box',
                      backgroundColor: darkMode ? '#1f1f23' : 'white',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: darkMode ? '#f3f4f6' : '#000'
                  }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientForm.first_name}
                    onChange={(e) => setClientForm({ ...clientForm, first_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                      boxSizing: 'border-box',
                      backgroundColor: darkMode ? '#1f1f23' : 'white',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: darkMode ? '#f3f4f6' : '#000'
                  }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientForm.last_name}
                    onChange={(e) => setClientForm({ ...clientForm, last_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                      boxSizing: 'border-box',
                      backgroundColor: darkMode ? '#1f1f23' : 'white',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClientModal(false)
                      setClientForm({ email: '', first_name: '', last_name: '' })
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: darkMode ? '#3f3f46' : '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#52525b' : '#555'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#3f3f46' : '#666'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0051cc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
                  >
                    Create Client
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedClient && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: darkMode ? '#27272a' : 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: darkMode ? '1px solid #3f3f46' : 'none',
            boxShadow: darkMode ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              margin: '0 0 0.5rem 0',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Manage Permissions
            </h3>
            <p style={{
              margin: '0 0 1.5rem 0',
              color: darkMode ? '#9ca3af' : '#666'
            }}>
              {selectedClient.first_name} {selectedClient.last_name}
            </p>

            <PermissionsEditor
              client={selectedClient}
              metaAdAccounts={metaAdAccounts}
              googleAdAccounts={googleAdAccounts}
              ga4Properties={ga4Properties}
              metaLeadForms={metaLeadForms}
              onSave={handleUpdatePermissions}
              onCancel={() => {
                setShowPermissionsModal(false)
                setSelectedClient(null)
              }}
              darkMode={darkMode}
            />
          </div>
        </div>
      )}

      {/* Structural Sync Modal */}
      {showStructuralSyncModal && (
        <StructuralSyncModal
          darkMode={darkMode}
          metaAdAccounts={metaAdAccounts}
          selectedAccountIds={selectedAccountIds}
          syncLoading={syncLoading}
          onToggleAccount={handleToggleAccount}
          onSelectAll={handleSelectAllAccounts}
          onSync={handleStructuralSync}
          onCancel={() => {
            setShowStructuralSyncModal(false)
            setSelectedAccountIds([])
          }}
        />
      )}

      {/* Insights Sync Modal */}
      {showInsightsSyncModal && (
        <InsightsSyncModal
          darkMode={darkMode}
          metaAdAccounts={metaAdAccounts}
          selectedAccountIds={selectedAccountIds}
          syncStartDate={syncStartDate}
          syncEndDate={syncEndDate}
          syncLoading={syncLoading}
          onToggleAccount={handleToggleAccount}
          onSelectAll={handleSelectAllAccounts}
          onStartDateChange={setSyncStartDate}
          onEndDateChange={setSyncEndDate}
          onSync={handleInsightsSync}
          onCancel={() => {
            setShowInsightsSyncModal(false)
            setSelectedAccountIds([])
          }}
        />
      )}

      {/* Google Ads Structural Sync Modal */}
      {showGoogleStructuralSyncModal && (
        <StructuralSyncModal
          darkMode={darkMode}
          metaAdAccounts={googleAdAccounts}
          selectedAccountIds={selectedGoogleAccountIds}
          syncLoading={syncLoading}
          onToggleAccount={handleToggleGoogleAccount}
          onSelectAll={handleSelectAllGoogleAccounts}
          onSync={handleGoogleStructuralSync}
          onCancel={() => {
            setShowGoogleStructuralSyncModal(false)
            setSelectedGoogleAccountIds([])
          }}
        />
      )}

      {/* Google Ads Insights Sync Modal */}
      {showGoogleInsightsSyncModal && (
        <InsightsSyncModal
          darkMode={darkMode}
          metaAdAccounts={googleAdAccounts}
          selectedAccountIds={selectedGoogleAccountIds}
          syncStartDate={syncStartDate}
          syncEndDate={syncEndDate}
          syncLoading={syncLoading}
          onToggleAccount={handleToggleGoogleAccount}
          onSelectAll={handleSelectAllGoogleAccounts}
          onStartDateChange={setSyncStartDate}
          onEndDateChange={setSyncEndDate}
          onSync={handleGoogleInsightsSync}
          onCancel={() => {
            setShowGoogleInsightsSyncModal(false)
            setSelectedGoogleAccountIds([])
          }}
        />
      )}

      {/* GA4 Insights Sync Modal */}
      {showGA4InsightsSyncModal && (
        <GA4InsightsSyncModal
          darkMode={darkMode}
          ga4Properties={ga4Properties}
          selectedPropertyIds={selectedGA4PropertyIds}
          syncStartDate={syncStartDate}
          syncEndDate={syncEndDate}
          syncLoading={syncLoading}
          onToggleProperty={handleToggleGA4Property}
          onSelectAll={handleSelectAllGA4Properties}
          onStartDateChange={setSyncStartDate}
          onEndDateChange={setSyncEndDate}
          onSync={handleGA4InsightsSync}
          onCancel={() => {
            setShowGA4InsightsSyncModal(false)
            setSelectedGA4PropertyIds([])
          }}
        />
      )}

      {/* Leads Structural Sync Modal (Pages -> Forms) */}
      {showLeadsStructuralSyncModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#27272a' : 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: darkMode ? '1px solid #3f3f46' : 'none'
          }}>
            <h2 style={{
              margin: '0 0 1.5rem 0',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Leads Form Sync
            </h2>
            <p style={{
              color: darkMode ? '#9ca3af' : '#666',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              Select Facebook Pages to sync their lead gen forms.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', backgroundColor: darkMode ? '#1e3a5f' : '#e7f3ff',
                borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
              }}>
                <input type="checkbox"
                  checked={selectedPageIds.length === metaPages.length && metaPages.length > 0}
                  onChange={handleSelectAllPages} style={{ cursor: 'pointer' }} />
                <span style={{ color: darkMode ? '#f3f4f6' : '#000' }}>
                  Select All ({selectedPageIds.length}/{metaPages.length})
                </span>
              </label>
            </div>

            <div style={{
              marginBottom: '1.5rem', maxHeight: '350px', overflowY: 'auto',
              border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
              borderRadius: '6px', padding: '0.5rem'
            }}>
              {metaPages.length === 0 ? (
                <p style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                  No pages available. Connect Meta first.
                </p>
              ) : (
                metaPages.map((page) => (
                  <label key={page.page_id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
                    borderRadius: '4px', cursor: 'pointer', marginBottom: '0.5rem',
                    backgroundColor: selectedPageIds.includes(page.page_id)
                      ? (darkMode ? '#1e3a5f' : '#e7f3ff') : 'transparent',
                    transition: 'background-color 0.2s ease',
                  }}>
                    <input type="checkbox" checked={selectedPageIds.includes(page.page_id)}
                      onChange={() => handleTogglePage(page.page_id)} style={{ cursor: 'pointer' }} />
                    <span style={{ flex: 1, color: darkMode ? '#f3f4f6' : '#000' }}>{page.name}</span>
                  </label>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => { setShowLeadsStructuralSyncModal(false); setSelectedPageIds([]) }}
                disabled={syncLoading}
                style={{
                  flex: 1, padding: '0.75rem', backgroundColor: darkMode ? '#3f3f46' : '#666',
                  color: 'white', border: 'none', borderRadius: '6px',
                  cursor: syncLoading ? 'not-allowed' : 'pointer', opacity: syncLoading ? 0.5 : 1,
                }}>Cancel</button>
              <button onClick={handleLeadsStructuralSync}
                disabled={syncLoading || selectedPageIds.length === 0}
                style={{
                  flex: 1, padding: '0.75rem',
                  backgroundColor: selectedPageIds.length === 0 || syncLoading ? '#ccc' : '#8b5cf6',
                  color: 'white', border: 'none', borderRadius: '6px',
                  cursor: selectedPageIds.length === 0 || syncLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                }}>{syncLoading ? 'Syncing...' : 'Start Form Sync'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Leads Sync Modal (Forms -> Leads) */}
      {showLeadsSyncModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#27272a' : 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: darkMode ? '1px solid #3f3f46' : 'none'
          }}>
            <h2 style={{
              margin: '0 0 1.5rem 0',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Leads Sync
            </h2>
            <p style={{
              color: darkMode ? '#9ca3af' : '#666',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              Select lead forms to sync leads (last 7 days).
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem', backgroundColor: darkMode ? '#1e3a5f' : '#e7f3ff',
                borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
              }}>
                <input type="checkbox"
                  checked={selectedFormIds.length === metaLeadForms.length && metaLeadForms.length > 0}
                  onChange={handleSelectAllForms} style={{ cursor: 'pointer' }} />
                <span style={{ color: darkMode ? '#f3f4f6' : '#000' }}>
                  Select All ({selectedFormIds.length}/{metaLeadForms.length})
                </span>
              </label>
            </div>

            <div style={{
              marginBottom: '1.5rem', maxHeight: '350px', overflowY: 'auto',
              border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
              borderRadius: '6px', padding: '0.5rem'
            }}>
              {metaLeadForms.length === 0 ? (
                <p style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
                  No lead forms available. Run Leads Form Sync first.
                </p>
              ) : (
                metaLeadForms.map((form) => (
                  <label key={form.form_id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
                    borderRadius: '4px', cursor: 'pointer', marginBottom: '0.5rem',
                    backgroundColor: selectedFormIds.includes(form.form_id)
                      ? (darkMode ? '#1e3a5f' : '#e7f3ff') : 'transparent',
                    transition: 'background-color 0.2s ease',
                  }}>
                    <input type="checkbox" checked={selectedFormIds.includes(form.form_id)}
                      onChange={() => handleToggleForm(form.form_id)} style={{ cursor: 'pointer' }} />
                    <span style={{ flex: 1, color: darkMode ? '#f3f4f6' : '#000' }}>{form.name}</span>
                    <span style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.75rem' }}>{form.page_name}</span>
                  </label>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => { setShowLeadsSyncModal(false); setSelectedFormIds([]) }}
                disabled={syncLoading}
                style={{
                  flex: 1, padding: '0.75rem', backgroundColor: darkMode ? '#3f3f46' : '#666',
                  color: 'white', border: 'none', borderRadius: '6px',
                  cursor: syncLoading ? 'not-allowed' : 'pointer', opacity: syncLoading ? 0.5 : 1,
                }}>Cancel</button>
              <button onClick={handleLeadsSync}
                disabled={syncLoading || selectedFormIds.length === 0}
                style={{
                  flex: 1, padding: '0.75rem',
                  backgroundColor: selectedFormIds.length === 0 || syncLoading ? '#ccc' : '#ec4899',
                  color: 'white', border: 'none', borderRadius: '6px',
                  cursor: selectedFormIds.length === 0 || syncLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                }}>{syncLoading ? 'Syncing...' : 'Start Leads Sync'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Permissions Editor Component
function PermissionsEditor({
  client,
  metaAdAccounts,
  googleAdAccounts,
  ga4Properties,
  metaLeadForms,
  onSave,
  onCancel,
  darkMode
}: {
  client: Client
  metaAdAccounts: AdAccount[]
  googleAdAccounts: AdAccount[]
  ga4Properties: GA4PropertyItem[]
  metaLeadForms: MetaLeadFormItem[]
  onSave: (permissions: Record<string, any>) => void
  onCancel: () => void
  darkMode: boolean
}) {
  const [selectedMeta, setSelectedMeta] = useState<string[]>(
    client.permissions?.meta_accounts_ids || []
  )
  const [selectedGoogle, setSelectedGoogle] = useState<string[]>(
    client.permissions?.google_accounts_ids || []
  )
  const [selectedGA4, setSelectedGA4] = useState<string[]>(
    client.permissions?.ga4_properties_ids || []
  )
  const [selectedForms, setSelectedForms] = useState<string[]>(
    client.permissions?.meta_form_ids || []
  )

  function handleToggle(list: string[], setList: (v: string[]) => void, id: string) {
    if (list.includes(id)) {
      setList(list.filter(x => x !== id))
    } else {
      setList([...list, id])
    }
  }

  function handleSave() {
    onSave({
      meta_accounts_ids: selectedMeta,
      google_accounts_ids: selectedGoogle,
      ga4_properties_ids: selectedGA4,
      meta_form_ids: selectedForms,
    })
  }

  const checkboxLabelStyle = (selected: boolean) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '0.5rem',
    padding: '0.75rem',
    border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer' as const,
    backgroundColor: selected
      ? (darkMode ? '#1e3a5f' : '#e7f3ff')
      : (darkMode ? '#1f1f23' : 'white'),
    transition: 'background-color 0.2s ease',
  })

  return (
    <div>
      {/* Meta */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: darkMode ? '#f3f4f6' : '#000' }}>
          Meta Ad Accounts
        </h4>
        {metaAdAccounts.length === 0 ? (
          <p style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.875rem' }}>
            No Meta ad accounts available. Connect Meta first.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {metaAdAccounts.map((account) => (
              <label key={account.account_id} style={checkboxLabelStyle(selectedMeta.includes(account.account_id))}>
                <input type="checkbox" checked={selectedMeta.includes(account.account_id)}
                  onChange={() => handleToggle(selectedMeta, setSelectedMeta, account.account_id)}
                  style={{ cursor: 'pointer' }} />
                <span style={{ flex: 1, color: darkMode ? '#f3f4f6' : '#000' }}>
                  {account.name} ({account.currency})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Google Ads */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: darkMode ? '#f3f4f6' : '#000' }}>
          Google Ads Accounts
        </h4>
        {googleAdAccounts.length === 0 ? (
          <p style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.875rem' }}>
            No Google Ads accounts available. Connect Google Ads first.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {googleAdAccounts.map((account) => (
              <label key={account.account_id} style={checkboxLabelStyle(selectedGoogle.includes(account.account_id))}>
                <input type="checkbox" checked={selectedGoogle.includes(account.account_id)}
                  onChange={() => handleToggle(selectedGoogle, setSelectedGoogle, account.account_id)}
                  style={{ cursor: 'pointer' }} />
                <span style={{ flex: 1, color: darkMode ? '#f3f4f6' : '#000' }}>
                  {account.name} ({account.currency})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* GA4 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: darkMode ? '#f3f4f6' : '#000' }}>
          GA4 Properties
        </h4>
        {ga4Properties.length === 0 ? (
          <p style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.875rem' }}>
            No GA4 properties available. Connect GA4 first.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ga4Properties.map((prop) => (
              <label key={prop.property_id} style={checkboxLabelStyle(selectedGA4.includes(prop.property_id))}>
                <input type="checkbox" checked={selectedGA4.includes(prop.property_id)}
                  onChange={() => handleToggle(selectedGA4, setSelectedGA4, prop.property_id)}
                  style={{ cursor: 'pointer' }} />
                <span style={{ flex: 1, color: darkMode ? '#f3f4f6' : '#000' }}>
                  {prop.name} ({prop.currency || prop.timezone})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Lead Forms */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: darkMode ? '#f3f4f6' : '#000' }}>
          Lead Forms
        </h4>
        {metaLeadForms.length === 0 ? (
          <p style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.875rem' }}>
            No lead forms available. Run Leads Form Sync first.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {metaLeadForms.map((form) => (
              <label key={form.form_id} style={checkboxLabelStyle(selectedForms.includes(form.form_id))}>
                <input type="checkbox" checked={selectedForms.includes(form.form_id)}
                  onChange={() => handleToggle(selectedForms, setSelectedForms, form.form_id)}
                  style={{ cursor: 'pointer' }} />
                <span style={{ flex: 1, color: darkMode ? '#f3f4f6' : '#000' }}>
                  {form.name}
                </span>
                <span style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.75rem' }}>
                  {form.page_name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '0.75rem', backgroundColor: darkMode ? '#3f3f46' : '#666',
          color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
          transition: 'background-color 0.2s ease'
        }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#52525b' : '#555'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#3f3f46' : '#666'}
        >Cancel</button>
        <button onClick={handleSave} style={{
          flex: 1, padding: '0.75rem', backgroundColor: '#0070f3', color: 'white',
          border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
          transition: 'background-color 0.2s ease'
        }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0051cc'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0070f3'}
        >Save Permissions</button>
      </div>
    </div>
  )
}

// Structural Sync Modal Component
function StructuralSyncModal({
  darkMode,
  metaAdAccounts,
  selectedAccountIds,
  syncLoading,
  onToggleAccount,
  onSelectAll,
  onSync,
  onCancel,
}: {
  darkMode: boolean
  metaAdAccounts: AdAccount[]
  selectedAccountIds: string[]
  syncLoading: boolean
  onToggleAccount: (accountId: string) => void
  onSelectAll: () => void
  onSync: () => void
  onCancel: () => void
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#27272a' : 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: darkMode ? '1px solid #3f3f46' : 'none'
      }}>
        <h2 style={{
          margin: '0 0 1.5rem 0',
          color: darkMode ? '#f3f4f6' : '#000'
        }}>
          Structural Sync
        </h2>

        <p style={{
          color: darkMode ? '#9ca3af' : '#666',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          Select ad accounts to sync structural data (campaigns, ad sets, ads, and creatives).
        </p>

        {/* Select All Checkbox */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: darkMode ? '#1e3a5f' : '#e7f3ff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            <input
              type="checkbox"
              checked={selectedAccountIds.length === metaAdAccounts.length && metaAdAccounts.length > 0}
              onChange={onSelectAll}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: darkMode ? '#f3f4f6' : '#000' }}>
              Select All ({selectedAccountIds.length}/{metaAdAccounts.length})
            </span>
          </label>
        </div>

        {/* Ad Accounts List */}
        <div style={{
          marginBottom: '1.5rem',
          maxHeight: '350px',
          overflowY: 'auto',
          border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
          borderRadius: '6px',
          padding: '0.5rem'
        }}>
          {metaAdAccounts.length === 0 ? (
            <p style={{
              color: darkMode ? '#9ca3af' : '#666',
              fontSize: '0.875rem',
              textAlign: 'center',
              padding: '1rem'
            }}>
              No ad accounts available
            </p>
          ) : (
            metaAdAccounts.map((account) => (
              <label
                key={account.account_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedAccountIds.includes(account.account_id)
                    ? (darkMode ? '#1e3a5f' : '#e7f3ff')
                    : 'transparent',
                  transition: 'background-color 0.2s ease',
                  marginBottom: '0.5rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAccountIds.includes(account.account_id)}
                  onChange={() => onToggleAccount(account.account_id)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{
                  flex: 1,
                  color: darkMode ? '#f3f4f6' : '#000'
                }}>
                  {account.name}
                </span>
                <span style={{
                  color: darkMode ? '#9ca3af' : '#666',
                  fontSize: '0.75rem'
                }}>
                  {account.currency}
                </span>
              </label>
            ))
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onCancel}
            disabled={syncLoading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: darkMode ? '#3f3f46' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: syncLoading ? 'not-allowed' : 'pointer',
              opacity: syncLoading ? 0.5 : 1,
              transition: 'background-color 0.2s ease'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSync}
            disabled={syncLoading || selectedAccountIds.length === 0}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: selectedAccountIds.length === 0 || syncLoading
                ? '#ccc'
                : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedAccountIds.length === 0 || syncLoading
                ? 'not-allowed'
                : 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s ease'
            }}
          >
            {syncLoading ? 'Syncing...' : 'Start Structural Sync'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Insights Sync Modal Component
function InsightsSyncModal({
  darkMode,
  metaAdAccounts,
  selectedAccountIds,
  syncStartDate,
  syncEndDate,
  syncLoading,
  onToggleAccount,
  onSelectAll,
  onStartDateChange,
  onEndDateChange,
  onSync,
  onCancel,
}: {
  darkMode: boolean
  metaAdAccounts: AdAccount[]
  selectedAccountIds: string[]
  syncStartDate: string
  syncEndDate: string
  syncLoading: boolean
  onToggleAccount: (accountId: string) => void
  onSelectAll: () => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onSync: () => void
  onCancel: () => void
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#27272a' : 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: darkMode ? '1px solid #3f3f46' : 'none'
      }}>
        <h2 style={{
          margin: '0 0 1.5rem 0',
          color: darkMode ? '#f3f4f6' : '#000'
        }}>
          Insights Sync
        </h2>

        <p style={{
          color: darkMode ? '#9ca3af' : '#666',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          Select ad accounts and date range to sync insights data at all levels (account, campaigns, ad sets, ads).
        </p>

        {/* Select All Checkbox */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: darkMode ? '#1e3a5f' : '#e7f3ff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            <input
              type="checkbox"
              checked={selectedAccountIds.length === metaAdAccounts.length && metaAdAccounts.length > 0}
              onChange={onSelectAll}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: darkMode ? '#f3f4f6' : '#000' }}>
              Select All ({selectedAccountIds.length}/{metaAdAccounts.length})
            </span>
          </label>
        </div>

        {/* Ad Accounts List */}
        <div style={{
          marginBottom: '1.5rem',
          maxHeight: '250px',
          overflowY: 'auto',
          border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
          borderRadius: '6px',
          padding: '0.5rem'
        }}>
          {metaAdAccounts.length === 0 ? (
            <p style={{
              color: darkMode ? '#9ca3af' : '#666',
              fontSize: '0.875rem',
              textAlign: 'center',
              padding: '1rem'
            }}>
              No ad accounts available
            </p>
          ) : (
            metaAdAccounts.map((account) => (
              <label
                key={account.account_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedAccountIds.includes(account.account_id)
                    ? (darkMode ? '#1e3a5f' : '#e7f3ff')
                    : 'transparent',
                  transition: 'background-color 0.2s ease',
                  marginBottom: '0.5rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAccountIds.includes(account.account_id)}
                  onChange={() => onToggleAccount(account.account_id)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{
                  flex: 1,
                  color: darkMode ? '#f3f4f6' : '#000'
                }}>
                  {account.name}
                </span>
                <span style={{
                  color: darkMode ? '#9ca3af' : '#666',
                  fontSize: '0.75rem'
                }}>
                  {account.currency}
                </span>
              </label>
            ))
          )}
        </div>

        {/* Date Range */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{
            margin: '0 0 1rem 0',
            color: darkMode ? '#f3f4f6' : '#000',
            fontSize: '0.875rem'
          }}>
            Date Range
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                color: darkMode ? '#9ca3af' : '#666'
              }}>
                Start Date
              </label>
              <input
                type="date"
                value={syncStartDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                max={syncEndDate}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#1f1f23' : 'white',
                  color: darkMode ? '#f3f4f6' : '#000'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                color: darkMode ? '#9ca3af' : '#666'
              }}>
                End Date
              </label>
              <input
                type="date"
                value={syncEndDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                min={syncStartDate}
                max={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? '#1f1f23' : 'white',
                  color: darkMode ? '#f3f4f6' : '#000'
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onCancel}
            disabled={syncLoading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: darkMode ? '#3f3f46' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: syncLoading ? 'not-allowed' : 'pointer',
              opacity: syncLoading ? 0.5 : 1,
              transition: 'background-color 0.2s ease'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSync}
            disabled={syncLoading || selectedAccountIds.length === 0}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: selectedAccountIds.length === 0 || syncLoading
                ? '#ccc'
                : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedAccountIds.length === 0 || syncLoading
                ? 'not-allowed'
                : 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s ease'
            }}
          >
            {syncLoading ? 'Syncing...' : 'Start Sync'}
          </button>
        </div>
      </div>
    </div>
  )
}

// GA4 Insights Sync Modal Component
function GA4InsightsSyncModal({
  darkMode,
  ga4Properties,
  selectedPropertyIds,
  syncStartDate,
  syncEndDate,
  syncLoading,
  onToggleProperty,
  onSelectAll,
  onStartDateChange,
  onEndDateChange,
  onSync,
  onCancel,
}: {
  darkMode: boolean
  ga4Properties: GA4PropertyItem[]
  selectedPropertyIds: string[]
  syncStartDate: string
  syncEndDate: string
  syncLoading: boolean
  onToggleProperty: (propertyId: string) => void
  onSelectAll: () => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onSync: () => void
  onCancel: () => void
}) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div style={{
        backgroundColor: darkMode ? '#27272a' : 'white',
        borderRadius: '8px', padding: '2rem', maxWidth: '600px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        border: darkMode ? '1px solid #3f3f46' : 'none'
      }}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: darkMode ? '#f3f4f6' : '#000' }}>
          GA4 Insights Sync
        </h2>
        <p style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Select GA4 properties and date range to sync analytics data.
        </p>

        {/* Select All */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
            backgroundColor: darkMode ? '#1e3a5f' : '#e7f3ff',
            borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
          }}>
            <input type="checkbox"
              checked={selectedPropertyIds.length === ga4Properties.length && ga4Properties.length > 0}
              onChange={onSelectAll} style={{ cursor: 'pointer' }} />
            <span style={{ color: darkMode ? '#f3f4f6' : '#000' }}>
              Select All ({selectedPropertyIds.length}/{ga4Properties.length})
            </span>
          </label>
        </div>

        {/* Properties List */}
        <div style={{
          marginBottom: '1.5rem', maxHeight: '250px', overflowY: 'auto',
          border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
          borderRadius: '6px', padding: '0.5rem'
        }}>
          {ga4Properties.length === 0 ? (
            <p style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
              No properties available. Sync properties first.
            </p>
          ) : (
            ga4Properties.map((prop) => (
              <label key={prop.property_id} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
                borderRadius: '4px', cursor: 'pointer',
                backgroundColor: selectedPropertyIds.includes(prop.property_id)
                  ? (darkMode ? '#1e3a5f' : '#e7f3ff') : 'transparent',
                transition: 'background-color 0.2s ease', marginBottom: '0.5rem'
              }}>
                <input type="checkbox"
                  checked={selectedPropertyIds.includes(prop.property_id)}
                  onChange={() => onToggleProperty(prop.property_id)}
                  style={{ cursor: 'pointer' }} />
                <span style={{ flex: 1, color: darkMode ? '#f3f4f6' : '#000' }}>{prop.name}</span>
                <span style={{ color: darkMode ? '#9ca3af' : '#666', fontSize: '0.75rem' }}>
                  {prop.currency || prop.timezone}
                </span>
              </label>
            ))
          )}
        </div>

        {/* Date Range */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: darkMode ? '#f3f4f6' : '#000', fontSize: '0.875rem' }}>Date Range</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: darkMode ? '#9ca3af' : '#666' }}>Start Date</label>
              <input type="date" value={syncStartDate} onChange={(e) => onStartDateChange(e.target.value)} max={syncEndDate}
                style={{ width: '100%', padding: '0.5rem', border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd', borderRadius: '4px', backgroundColor: darkMode ? '#1f1f23' : 'white', color: darkMode ? '#f3f4f6' : '#000' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: darkMode ? '#9ca3af' : '#666' }}>End Date</label>
              <input type="date" value={syncEndDate} onChange={(e) => onEndDateChange(e.target.value)} min={syncStartDate} max={new Date().toISOString().split('T')[0]}
                style={{ width: '100%', padding: '0.5rem', border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd', borderRadius: '4px', backgroundColor: darkMode ? '#1f1f23' : 'white', color: darkMode ? '#f3f4f6' : '#000' }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onCancel} disabled={syncLoading} style={{
            flex: 1, padding: '0.75rem', backgroundColor: darkMode ? '#3f3f46' : '#666',
            color: 'white', border: 'none', borderRadius: '6px',
            cursor: syncLoading ? 'not-allowed' : 'pointer', opacity: syncLoading ? 0.5 : 1
          }}>Cancel</button>
          <button onClick={onSync} disabled={syncLoading || selectedPropertyIds.length === 0} style={{
            flex: 1, padding: '0.75rem',
            backgroundColor: selectedPropertyIds.length === 0 || syncLoading ? '#ccc' : '#0070f3',
            color: 'white', border: 'none', borderRadius: '6px',
            cursor: selectedPropertyIds.length === 0 || syncLoading ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}>
            {syncLoading ? 'Syncing...' : 'Start Sync'}
          </button>
        </div>
      </div>
    </div>
  )
}
