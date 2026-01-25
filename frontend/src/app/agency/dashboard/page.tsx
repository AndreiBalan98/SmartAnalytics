'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import DarkModeToggle from '@/components/DarkModeToggle'
import AgencyDashboardSkeleton from '@/components/AgencyDashboardSkeleton'

interface Client {
  id: number
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
  permissions: {
    meta_accounts?: string[]
    google_accounts?: string[]
    ga4_properties?: string[]
  }
  is_active: boolean
  invited_at: string
}

interface Integration {
  connected: boolean
  business_name?: string
  customer_id?: string
  property_name?: string
}

interface AdAccount {
  id: string
  name: string
  currency: string
}

export default function AgencyDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout, darkMode } = useAuth()

  // State
  const [clients, setClients] = useState<Client[]>([])
  const [integrations, setIntegrations] = useState<{
    meta: Integration
    google_ads: Integration
    ga4: Integration
  } | null>(null)
  const [metaAdAccounts, setMetaAdAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sync state
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  // Modal states
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)

  // Sync modal state
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
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
      router.push('/agency/login')
    } else if (!authLoading && user && user.user_type !== 'agency') {
      router.push('/')
    } else if (!authLoading && user && user.user_type === 'agency') {
      loadDashboardData()
      
      // Check for Meta connection success
      const params = new URLSearchParams(window.location.search)
      if (params.get('meta_connected') === 'true') {
        setError(null)
        // Show success message (you can add a success state if needed)
        setTimeout(() => {
          window.history.replaceState({}, '', '/agency/dashboard')
        }, 2000)
      } else if (params.get('error')) {
        setError(decodeURIComponent(params.get('error')!))
        setTimeout(() => {
          window.history.replaceState({}, '', '/agency/dashboard')
        }, 5000)
      }
    }
  }, [user, authLoading, router])

  async function loadDashboardData() {
    setLoading(true)
    setError(null)

    try {
      const [clientsData, integrationsData] = await Promise.all([
        api.listClients(),
        api.getIntegrationsStatus(),
      ])

      setClients(clientsData.clients || [])
      setIntegrations(integrationsData.integrations)

      // If Meta is connected, load ad accounts
      if (integrationsData.integrations.meta.connected) {
        try {
          const adAccountsData = await api.getAgencyAdAccounts()
          setMetaAdAccounts(adAccountsData.ad_accounts || [])
        } catch (err) {
          console.error('Failed to load Meta ad accounts:', err)
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

      // Refresh clients list
      await loadDashboardData()

      // Reset form
      setClientForm({ email: '', first_name: '', last_name: '' })
      
      // Don't close modal if password was generated (show it first)
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

  function handleConnectMeta() {
    const authUrl = '/api/meta/start'

    // Open popup window
    const popup = window.open(
      authUrl,
      'MetaOAuth',
      'width=600,height=700,left=300,top=100'
    )

    // Listen for popup close (callback will update state)
    const interval = setInterval(() => {
      if (popup?.closed) {
        clearInterval(interval)
        // Refresh integration status
        loadDashboardData()
      }
    }, 1000)
  }

  async function handleSyncData() {
    // OLD: Direct sync - REPLACED with modal
    // Now we open modal for user to select accounts and date range
    setShowSyncModal(true)
  }

  async function handleSyncInsights() {
    if (selectedAccountIds.length === 0) {
      setError('Please select at least one ad account')
      return
    }

    setSyncLoading(true)
    setSyncResult(null)
    setError(null)

    try {
      const result = await api.triggerInsightsSync({
        ad_account_ids: selectedAccountIds,
        start_date: syncStartDate,
        end_date: syncEndDate,
      })

      setSyncResult(result)
      setShowSyncModal(false) // Close modal on success

      // Auto-hide success message after 10 seconds
      setTimeout(() => {
        setSyncResult(null)
      }, 10000)
    } catch (err: any) {
      setError(err.message || 'Failed to sync insights')
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
      setSelectedAccountIds(metaAdAccounts.map(acc => acc.id))
    }
  }

  if (authLoading || loading) {
    return <AgencyDashboardSkeleton darkMode={darkMode} />
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
            {user.agency?.name || 'Your Agency'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <DarkModeToggle />
          <button
            onClick={() => router.push('/agency/api-tester')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#9333ea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7e22ce'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
          >
            🧪 API Tester
          </button>
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
            <strong>✅ Sync Completed Successfully!</strong>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              {/* Ad Accounts Details */}
              {syncResult.ad_accounts && syncResult.ad_accounts.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Ad Accounts ({syncResult.ad_accounts_synced}):</strong>
                  {syncResult.ad_accounts.map((account: any) => (
                    <div key={account.id} style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                      • {account.name} ({account.id})
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div style={{ borderTop: '1px solid #c3e6cb', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <div>• Campaigns: {syncResult.campaigns.created} created, {syncResult.campaigns.updated} updated</div>
                <div>• Ad Sets: {syncResult.ad_sets.created} created, {syncResult.ad_sets.updated} updated</div>
                <div>• Ads: {syncResult.ads.created} created, {syncResult.ads.updated} updated</div>
                <div>• Metrics: {syncResult.metrics.created} created, {syncResult.metrics.updated} updated</div>
              </div>

              {syncResult.errors && syncResult.errors.length > 0 && (
                <div style={{ marginTop: '0.5rem', color: '#856404' }}>
                  ⚠️ {syncResult.errors.length} warning(s) during sync
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
                <span style={{ fontSize: '1.5rem' }}>📘</span>
                <strong style={{ color: darkMode ? '#f3f4f6' : '#000' }}>Meta Ads</strong>
              </div>
              {integrations?.meta.connected ? (
                <>
                  <div style={{
                    padding: '0.5rem',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    color: '#155724',
                    fontSize: '0.875rem'
                  }}>
                    ✅ Connected
                    {integrations.meta.business_name && (
                      <div style={{ marginTop: '0.25rem' }}>
                        {integrations.meta.business_name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSyncData}
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
                    {syncLoading ? 'Syncing...' : '🔄 Sync Data'}
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
                    ❌ Not Connected
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
                <span style={{ fontSize: '1.5rem' }}>🔍</span>
                <strong style={{ color: darkMode ? '#f3f4f6' : '#000' }}>Google Ads</strong>
              </div>
              <div style={{
                padding: '0.5rem',
                backgroundColor: darkMode ? '#3f2e1e' : '#fff3cd',
                borderRadius: '4px',
                color: darkMode ? '#fbbf24' : '#856404',
                fontSize: '0.875rem'
              }}>
                ⏳ Coming in FAZA 5
              </div>
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
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <strong style={{ color: darkMode ? '#f3f4f6' : '#000' }}>Google Analytics 4</strong>
              </div>
              <div style={{
                padding: '0.5rem',
                backgroundColor: darkMode ? '#3f2e1e' : '#fff3cd',
                borderRadius: '4px',
                color: darkMode ? '#fbbf24' : '#856404',
                fontSize: '0.875rem'
              }}>
                ⏳ Coming in FAZA 5
              </div>
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
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}>Name</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}>Email</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}>Permissions</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'left',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}>Status</th>
                    <th style={{
                      padding: '0.75rem',
                      textAlign: 'center',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}>Actions</th>
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
                        {client.user.first_name} {client.user.last_name}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        color: darkMode ? '#9ca3af' : '#000'
                      }}>{client.user.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {client.permissions.meta_accounts && client.permissions.meta_accounts.length > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: darkMode ? '#1e3a5f' : '#e7f3ff',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: darkMode ? '#93c5fd' : '#0369a1'
                            }}>
                              Meta ({client.permissions.meta_accounts.length})
                            </span>
                          )}
                          {client.permissions.google_accounts && client.permissions.google_accounts.length > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: darkMode ? '#3f2e1e' : '#fff3e0',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: darkMode ? '#fbbf24' : '#b45309'
                            }}>
                              Google ({client.permissions.google_accounts.length})
                            </span>
                          )}
                          {(!client.permissions.meta_accounts || client.permissions.meta_accounts.length === 0) &&
                           (!client.permissions.google_accounts || client.permissions.google_accounts.length === 0) && (
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
                    ⚠️ Copy this password and send it to the client securely. It won't be shown again.
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
              {selectedClient.user.first_name} {selectedClient.user.last_name}
            </p>

            <PermissionsEditor
              client={selectedClient}
              metaAdAccounts={metaAdAccounts}
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

      {/* Sync Insights Modal */}
      {showSyncModal && (
        <SyncInsightsModal
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
          onSync={handleSyncInsights}
          onCancel={() => setShowSyncModal(false)}
        />
      )}
    </div>
  )
}

// Permissions Editor Component
function PermissionsEditor({
  client,
  metaAdAccounts,
  onSave,
  onCancel,
  darkMode
}: {
  client: Client
  metaAdAccounts: AdAccount[]
  onSave: (permissions: Record<string, any>) => void
  onCancel: () => void
  darkMode: boolean
}) {
  const [selectedMeta, setSelectedMeta] = useState<string[]>(
    client.permissions.meta_accounts || []
  )

  function handleToggleMeta(accountId: string) {
    if (selectedMeta.includes(accountId)) {
      setSelectedMeta(selectedMeta.filter(id => id !== accountId))
    } else {
      setSelectedMeta([...selectedMeta, accountId])
    }
  }

  function handleSave() {
    onSave({
      meta_accounts: selectedMeta,
      google_accounts: client.permissions.google_accounts || [],
      ga4_properties: client.permissions.ga4_properties || [],
    })
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{
          margin: '0 0 1rem 0',
          color: darkMode ? '#f3f4f6' : '#000'
        }}>
          📘 Meta Ad Accounts
        </h4>
        {metaAdAccounts.length === 0 ? (
          <p style={{
            color: darkMode ? '#9ca3af' : '#666',
            fontSize: '0.875rem'
          }}>
            No Meta ad accounts available. Connect Meta first.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {metaAdAccounts.map((account) => (
              <label
                key={account.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: selectedMeta.includes(account.id)
                    ? (darkMode ? '#1e3a5f' : '#e7f3ff')
                    : (darkMode ? '#1f1f23' : 'white'),
                  transition: 'background-color 0.2s ease'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedMeta.includes(account.id)}
                  onChange={() => handleToggleMeta(account.id)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{
                  flex: 1,
                  color: darkMode ? '#f3f4f6' : '#000'
                }}>
                  {account.name} ({account.currency})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{
          margin: '0 0 0.5rem 0',
          color: darkMode ? '#f3f4f6' : '#000'
        }}>
          🔍 Google Ads Accounts
        </h4>
        <p style={{
          color: darkMode ? '#6b7280' : '#999',
          fontSize: '0.875rem'
        }}>
          Coming in FAZA 5
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{
          margin: '0 0 0.5rem 0',
          color: darkMode ? '#f3f4f6' : '#000'
        }}>
          📊 GA4 Properties
        </h4>
        <p style={{
          color: darkMode ? '#6b7280' : '#999',
          fontSize: '0.875rem'
        }}>
          Coming in FAZA 5
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={onCancel}
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
          onClick={handleSave}
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
          Save Permissions
        </button>
      </div>
    </div>
  )
}

// ========== SYNC INSIGHTS MODAL COMPONENT ==========
function SyncInsightsModal({
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
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
          🔄 Sync Insights
        </h2>

        <p style={{
          color: darkMode ? '#9ca3af' : '#666',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          Select ad accounts and date range to sync insights. We'll first update the structural data (campaigns, ad sets, ads), then fetch insights.
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
                key={account.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedAccountIds.includes(account.id)
                    ? (darkMode ? '#1e3a5f' : '#e7f3ff')
                    : 'transparent',
                  transition: 'background-color 0.2s ease',
                  marginBottom: '0.5rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedAccountIds.includes(account.id)}
                  onChange={() => onToggleAccount(account.id)}
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
            📅 Date Range
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
            {syncLoading ? '⏳ Syncing...' : '🔄 Start Sync'}
          </button>
        </div>
      </div>
    </div>
  )
}