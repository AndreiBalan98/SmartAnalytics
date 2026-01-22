'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

interface OAuthUser {
  id: number
  agency_id: number
  agency_name: string
  business_id: string
  business_name: string
  created_at: string
  expires_at: string
  last_synced_at: string | null
}

interface ApiLog {
  timestamp: string
  endpoint: string
  request: any
  response: any
  success: boolean
}

export default function ApiTesterPage() {
  const router = useRouter()
  const { user, loading: authLoading, darkMode } = useAuth()

  // State
  const [users, setUsers] = useState<OAuthUser[]>([])
  const [selectedUser, setSelectedUser] = useState<OAuthUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [tableData, setTableData] = useState<any>(null)

  // Input states for various API calls
  const [adAccountId, setAdAccountId] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [adSetId, setAdSetId] = useState('')
  const [creativeId, setCreativeId] = useState('')
  const [insightsObjectId, setInsightsObjectId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/agency/login')
    } else if (!authLoading && user && user.user_type !== 'agency') {
      router.push('/')
    } else if (!authLoading && user && user.user_type === 'agency') {
      loadOAuthUsers()
    }
  }, [user, authLoading, router])

  async function loadOAuthUsers() {
    try {
      const response = await api.testListOAuthUsers()
      setUsers(response.users || [])
    } catch (err) {
      console.error('Failed to load OAuth users:', err)
    }
  }

  function addLog(endpoint: string, result: any) {
    const log: ApiLog = {
      timestamp: new Date().toISOString(),
      endpoint,
      request: result.request || {},
      response: result.response || {},
      success: result.success || false
    }
    setLogs(prev => [log, ...prev])

    // Update table data if response has data
    if (result.response?.data) {
      setTableData(result.response.data)
    }
  }

  async function handleApiCall(endpoint: string, params: any = {}) {
    if (!selectedUser) {
      alert('Please select a user first')
      return
    }

    setLoading(true)
    try {
      let result
      const baseParams = { integration_id: selectedUser.id, ...params }

      switch (endpoint) {
        case 'user-info':
          result = await api.testUserInfo(baseParams)
          break
        case 'businesses':
          result = await api.testBusinesses(baseParams)
          break
        case 'ad-accounts':
          result = await api.testAdAccounts(baseParams)
          break
        case 'campaigns':
          if (!adAccountId) {
            alert('Please enter Ad Account ID')
            return
          }
          result = await api.testCampaigns({ ...baseParams, ad_account_id: adAccountId })
          break
        case 'ad-sets':
          if (!campaignId) {
            alert('Please enter Campaign ID')
            return
          }
          result = await api.testAdSets({ ...baseParams, campaign_id: campaignId })
          break
        case 'ads':
          if (!adSetId) {
            alert('Please enter Ad Set ID')
            return
          }
          result = await api.testAds({ ...baseParams, ad_set_id: adSetId })
          break
        case 'creatives':
          if (!creativeId) {
            alert('Please enter Creative ID')
            return
          }
          result = await api.testCreatives({ ...baseParams, creative_id: creativeId })
          break
        case 'insights':
          if (!insightsObjectId) {
            alert('Please enter Object ID (ad account, campaign, ad set, or ad)')
            return
          }
          result = await api.testInsights({
            ...baseParams,
            object_id: insightsObjectId,
            start_date: startDate,
            end_date: endDate
          })
          break
        default:
          return
      }

      addLog(endpoint, result)
    } catch (err: any) {
      addLog(endpoint, {
        request: {},
        response: { error: err.message },
        success: false
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !user || user.user_type !== 'agency') {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: darkMode ? '#1a1a1a' : '#f8f9fa'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.75rem',
            color: darkMode ? '#f3f4f6' : '#000'
          }}>
            Meta API Tester
          </h1>
          <button
            onClick={() => router.push('/agency/dashboard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: darkMode ? '#3f3f46' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* User Selector */}
        <div style={{
          backgroundColor: darkMode ? '#27272a' : 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: darkMode ? '1px solid #3f3f46' : 'none'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: darkMode ? '#f3f4f6' : '#000'
          }}>
            Select OAuth User:
          </label>
          <select
            value={selectedUser?.id || ''}
            onChange={(e) => {
              const user = users.find(u => u.id === parseInt(e.target.value))
              setSelectedUser(user || null)
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
              backgroundColor: darkMode ? '#1f1f23' : 'white',
              color: darkMode ? '#f3f4f6' : '#000'
            }}
          >
            <option value="">-- Select a user --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.agency_name} - {user.business_name} (ID: {user.id})
              </option>
            ))}
          </select>
        </div>

        {/* API Call Buttons */}
        <div style={{
          backgroundColor: darkMode ? '#27272a' : 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: darkMode ? '1px solid #3f3f46' : 'none'
        }}>
          <h2 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.25rem',
            color: darkMode ? '#f3f4f6' : '#000'
          }}>
            API Endpoints
          </h2>

          {/* Simple Endpoints */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1rem',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Basic Info
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleApiCall('user-info')}
                disabled={loading || !selectedUser}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: loading || !selectedUser ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !selectedUser ? 'not-allowed' : 'pointer'
                }}
              >
                User Info
              </button>
              <button
                onClick={() => handleApiCall('businesses')}
                disabled={loading || !selectedUser}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: loading || !selectedUser ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !selectedUser ? 'not-allowed' : 'pointer'
                }}
              >
                Businesses
              </button>
              <button
                onClick={() => handleApiCall('ad-accounts')}
                disabled={loading || !selectedUser}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: loading || !selectedUser ? '#ccc' : '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !selectedUser ? 'not-allowed' : 'pointer'
                }}
              >
                Ad Accounts
              </button>
            </div>
          </div>

          {/* Campaigns */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1rem',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Campaigns
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Ad Account ID (e.g., act_123456)"
                value={adAccountId}
                onChange={(e) => setAdAccountId(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  backgroundColor: darkMode ? '#1f1f23' : 'white',
                  color: darkMode ? '#f3f4f6' : '#000',
                  minWidth: '250px'
                }}
              />
              <button
                onClick={() => handleApiCall('campaigns')}
                disabled={loading || !selectedUser}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: loading || !selectedUser ? '#ccc' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !selectedUser ? 'not-allowed' : 'pointer'
                }}
              >
                Get Campaigns
              </button>
            </div>
          </div>

          {/* Ad Sets */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1rem',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Ad Sets
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Campaign ID"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  backgroundColor: darkMode ? '#1f1f23' : 'white',
                  color: darkMode ? '#f3f4f6' : '#000',
                  minWidth: '250px'
                }}
              />
              <button
                onClick={() => handleApiCall('ad-sets')}
                disabled={loading || !selectedUser}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: loading || !selectedUser ? '#ccc' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !selectedUser ? 'not-allowed' : 'pointer'
                }}
              >
                Get Ad Sets
              </button>
            </div>
          </div>

          {/* Ads */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1rem',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Ads
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Ad Set ID"
                value={adSetId}
                onChange={(e) => setAdSetId(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  backgroundColor: darkMode ? '#1f1f23' : 'white',
                  color: darkMode ? '#f3f4f6' : '#000',
                  minWidth: '250px'
                }}
              />
              <button
                onClick={() => handleApiCall('ads')}
                disabled={loading || !selectedUser}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: loading || !selectedUser ? '#ccc' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !selectedUser ? 'not-allowed' : 'pointer'
                }}
              >
                Get Ads
              </button>
            </div>
          </div>

          {/* Creatives */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1rem',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Creatives
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Creative ID"
                value={creativeId}
                onChange={(e) => setCreativeId(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  backgroundColor: darkMode ? '#1f1f23' : 'white',
                  color: darkMode ? '#f3f4f6' : '#000',
                  minWidth: '250px'
                }}
              />
              <button
                onClick={() => handleApiCall('creatives')}
                disabled={loading || !selectedUser}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: loading || !selectedUser ? '#ccc' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !selectedUser ? 'not-allowed' : 'pointer'
                }}
              >
                Get Creative
              </button>
            </div>
          </div>

          {/* Insights */}
          <div>
            <h3 style={{
              margin: '0 0 0.75rem 0',
              fontSize: '1rem',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Insights
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Object ID (account/campaign/adset/ad)"
                value={insightsObjectId}
                onChange={(e) => setInsightsObjectId(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  backgroundColor: darkMode ? '#1f1f23' : 'white',
                  color: darkMode ? '#f3f4f6' : '#000',
                  minWidth: '250px'
                }}
              />
              <input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  backgroundColor: darkMode ? '#1f1f23' : 'white',
                  color: darkMode ? '#f3f4f6' : '#000'
                }}
              />
              <input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid #3f3f46' : '1px solid #ddd',
                  backgroundColor: darkMode ? '#1f1f23' : 'white',
                  color: darkMode ? '#f3f4f6' : '#000'
                }}
              />
              <button
                onClick={() => handleApiCall('insights')}
                disabled={loading || !selectedUser}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: loading || !selectedUser ? '#ccc' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || !selectedUser ? 'not-allowed' : 'pointer'
                }}
              >
                Get Insights
              </button>
            </div>
          </div>
        </div>

        {/* Console Logs */}
        <div style={{
          backgroundColor: darkMode ? '#27272a' : 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: darkMode ? '1px solid #3f3f46' : 'none'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.25rem',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Console Logs
            </h2>
            <button
              onClick={() => setLogs([])}
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
              Clear Logs
            </button>
          </div>

          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: darkMode ? '#1f1f23' : '#f8f9fa',
            borderRadius: '6px',
            padding: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }}>
            {logs.length === 0 ? (
              <p style={{ color: darkMode ? '#9ca3af' : '#666', margin: 0 }}>
                No logs yet. Make an API call to see logs here.
              </p>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{
                  marginBottom: '1.5rem',
                  paddingBottom: '1.5rem',
                  borderBottom: index < logs.length - 1 ? (darkMode ? '1px solid #3f3f46' : '1px solid #ddd') : 'none'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <strong style={{
                      color: log.success ? '#10b981' : '#ef4444'
                    }}>
                      {log.success ? '✅' : '❌'} {log.endpoint}
                    </strong>
                    <span style={{ color: darkMode ? '#9ca3af' : '#666' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: darkMode ? '#93c5fd' : '#0369a1' }}>Request:</strong>
                    <pre style={{
                      margin: '0.25rem 0 0 0',
                      padding: '0.5rem',
                      backgroundColor: darkMode ? '#27272a' : 'white',
                      borderRadius: '4px',
                      overflow: 'auto',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}>
                      {JSON.stringify(log.request, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <strong style={{ color: darkMode ? '#86efac' : '#059669' }}>Response:</strong>
                    <pre style={{
                      margin: '0.25rem 0 0 0',
                      padding: '0.5rem',
                      backgroundColor: darkMode ? '#27272a' : 'white',
                      borderRadius: '4px',
                      overflow: 'auto',
                      color: darkMode ? '#f3f4f6' : '#000'
                    }}>
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Table Display */}
        {tableData && (
          <div style={{
            backgroundColor: darkMode ? '#27272a' : 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            border: darkMode ? '1px solid #3f3f46' : 'none'
          }}>
            <h2 style={{
              margin: '0 0 1rem 0',
              fontSize: '1.25rem',
              color: darkMode ? '#f3f4f6' : '#000'
            }}>
              Table View
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <pre style={{
                margin: 0,
                padding: '1rem',
                backgroundColor: darkMode ? '#1f1f23' : '#f8f9fa',
                borderRadius: '6px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: darkMode ? '#f3f4f6' : '#000'
              }}>
                {JSON.stringify(tableData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
