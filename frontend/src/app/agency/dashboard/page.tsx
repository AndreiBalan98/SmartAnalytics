'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

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
  const { user, loading: authLoading, logout } = useAuth()

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
  const [syncingMeta, setSyncingMeta] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  // Modal states
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)

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
          const adAccountsData = await api.getMetaAdAccounts()
          setMetaAdAccounts(adAccountsData.data || [])
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

  async function handleSyncMeta() {
    setError(null)
    setSyncMessage(null)
    setSyncingMeta(true)

    try {
      const result = await api.syncMetaData()
      setSyncMessage(result.message || 'Meta data synced successfully')

      // After syncing, refresh dashboard data (ad accounts etc.)
      await loadDashboardData()
    } catch (err: any) {
      setError(err.message || 'Failed to sync Meta data')
    } finally {
      setSyncingMeta(false)
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
    window.location.href = '/api/meta/start'
  }

  if (authLoading || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || user.user_type !== 'agency') {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f8f9fa' }}>
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
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Agency Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            {user.agency?.name || 'Your Agency'}
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Error Message */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee',
            borderRadius: '8px',
            marginBottom: '2rem',
            color: '#c00'
          }}>
            {error}
          </div>
        )}

        {/* Sync Message */}
        {syncMessage && !error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#e6ffed',
            borderRadius: '8px',
            marginBottom: '2rem',
            color: '#1a7f37'
          }}>
            {syncMessage}
          </div>
        )}

        {/* Platform Integrations Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Platform Integrations</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Meta Ads */}
            <div style={{
              padding: '1rem',
              border: '2px solid #ddd',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📘</span>
                <strong>Meta Ads</strong>
              </div>
              {integrations?.meta.connected ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                      <button
                        onClick={handleSyncMeta}
                        disabled={syncingMeta}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: syncingMeta ? '#999' : '#0070f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: syncingMeta ? 'default' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}
                      >
                        {syncingMeta ? 'Syncing...' : 'Sync Data'}
                      </button>
                    </div>
                  </div>
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
              border: '2px solid #ddd',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔍</span>
                <strong>Google Ads</strong>
              </div>
              <div style={{
                padding: '0.5rem',
                backgroundColor: '#fff3cd',
                borderRadius: '4px',
                color: '#856404',
                fontSize: '0.875rem'
              }}>
                ⏳ Coming in FAZA 5
              </div>
            </div>

            {/* GA4 */}
            <div style={{
              padding: '1rem',
              border: '2px solid #ddd',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <strong>Google Analytics 4</strong>
              </div>
              <div style={{
                padding: '0.5rem',
                backgroundColor: '#fff3cd',
                borderRadius: '4px',
                color: '#856404',
                fontSize: '0.875rem'
              }}>
                ⏳ Coming in FAZA 5
              </div>
            </div>
          </div>
        </div>

        {/* Clients Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Clients ({clients.length})</h2>
            <button
              onClick={() => setShowAddClientModal(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              + Add Client
            </button>
          </div>

          {clients.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              No clients yet. Click "Add Client" to get started.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Permissions</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {client.user.first_name} {client.user.last_name}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{client.user.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {client.permissions.meta_accounts && client.permissions.meta_accounts.length > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#e7f3ff',
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}>
                              Meta ({client.permissions.meta_accounts.length})
                            </span>
                          )}
                          {client.permissions.google_accounts && client.permissions.google_accounts.length > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#fff3e0',
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}>
                              Google ({client.permissions.google_accounts.length})
                            </span>
                          )}
                          {(!client.permissions.meta_accounts || client.permissions.meta_accounts.length === 0) &&
                           (!client.permissions.google_accounts || client.permissions.google_accounts.length === 0) && (
                            <span style={{ color: '#999', fontSize: '0.875rem' }}>None</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: client.is_active ? '#d4edda' : '#f8d7da',
                          color: client.is_active ? '#155724' : '#721c24',
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
                              fontSize: '0.875rem'
                            }}
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
                              fontSize: '0.875rem'
                            }}
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
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Add New Client</h3>
            
            {newPassword ? (
              <div>
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#d4edda',
                  borderRadius: '6px',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: '#155724' }}>
                    Client created successfully!
                  </p>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#155724' }}>
                    Temporary Password:
                  </p>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    wordBreak: 'break-all'
                  }}>
                    {newPassword}
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#856404' }}>
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
                    fontWeight: '600'
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddClient}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
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
                      border: '1px solid #ddd',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
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
                      border: '1px solid #ddd',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
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
                      border: '1px solid #ddd',
                      boxSizing: 'border-box'
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
                      backgroundColor: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
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
                      fontWeight: '600'
                    }}
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
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>
              Manage Permissions
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#666' }}>
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
            />
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
  onSave,
  onCancel
}: {
  client: Client
  metaAdAccounts: AdAccount[]
  onSave: (permissions: Record<string, any>) => void
  onCancel: () => void
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
        <h4 style={{ margin: '0 0 1rem 0' }}>📘 Meta Ad Accounts</h4>
        {metaAdAccounts.length === 0 ? (
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
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
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: selectedMeta.includes(account.id) ? '#e7f3ff' : 'white'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedMeta.includes(account.id)}
                  onChange={() => handleToggleMeta(account.id)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ flex: 1 }}>
                  {account.name} ({account.currency})
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>🔍 Google Ads Accounts</h4>
        <p style={{ color: '#999', fontSize: '0.875rem' }}>Coming in FAZA 5</p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>📊 GA4 Properties</h4>
        <p style={{ color: '#999', fontSize: '0.875rem' }}>Coming in FAZA 5</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '0.75rem',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
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
            fontWeight: '600'
          }}
        >
          Save Permissions
        </button>
      </div>
    </div>
  )
}