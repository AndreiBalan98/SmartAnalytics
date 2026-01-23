/**
 * InsightsView Component
 * Displays insights/metrics with summary cards and optional charts
 */

interface Insight {
  id: number
  level: string
  object_id: string
  date_start: string
  date_stop: string
  metrics: any
}

interface InsightsViewProps {
  insights: Insight[]
  loading?: boolean
}

export default function InsightsView({ insights, loading = false }: InsightsViewProps) {
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading insights...
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#9ca3af',
      }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Insights Available</p>
        <p style={{ fontSize: '0.875rem' }}>
          Run insights sync from agency dashboard to populate metrics data.
        </p>
      </div>
    )
  }

  // Calculate summary metrics
  const summary = insights.reduce(
    (acc, insight) => {
      const metrics = insight.metrics || {}
      return {
        impressions: acc.impressions + (parseInt(metrics.impressions) || 0),
        clicks: acc.clicks + (parseInt(metrics.clicks) || 0),
        spend: acc.spend + (parseFloat(metrics.spend) || 0),
        reach: acc.reach + (parseInt(metrics.reach) || 0),
      }
    },
    { impressions: 0, clicks: 0, spend: 0, reach: 0 }
  )

  const ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0
  const cpc = summary.clicks > 0 ? summary.spend / summary.clicks : 0
  const cpm = summary.impressions > 0 ? (summary.spend / summary.impressions) * 1000 : 0

  const statCards = [
    { label: 'Total Spend', value: `$${summary.spend.toFixed(2)}`, icon: '💰', color: '#3b82f6' },
    { label: 'Impressions', value: summary.impressions.toLocaleString(), icon: '👁️', color: '#10b981' },
    { label: 'Clicks', value: summary.clicks.toLocaleString(), icon: '🖱️', color: '#f59e0b' },
    { label: 'Reach', value: summary.reach.toLocaleString(), icon: '📢', color: '#8b5cf6' },
    { label: 'CTR', value: `${ctr.toFixed(2)}%`, icon: '📈', color: '#06b6d4' },
    { label: 'CPC', value: `$${cpc.toFixed(2)}`, icon: '💵', color: '#ec4899' },
    { label: 'CPM', value: `$${cpm.toFixed(2)}`, icon: '📊', color: '#6366f1' },
  ]

  return (
    <div style={{ padding: '1rem' }}>
      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.borderColor = card.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                {card.label}
              </span>
              <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
            </div>
            <div style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: card.color,
            }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Insights Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>
            Daily Breakdown ({insights.length} entries)
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#f9fafb',
                borderBottom: '2px solid #e5e7eb',
              }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                  Date
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                  Level
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                  Impressions
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                  Clicks
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                  Spend
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
                  CTR
                </th>
              </tr>
            </thead>
            <tbody>
              {insights.slice(0, 50).map((insight, index) => {
                const metrics = insight.metrics || {}
                const impressions = parseInt(metrics.impressions) || 0
                const clicks = parseInt(metrics.clicks) || 0
                const spend = parseFloat(metrics.spend) || 0
                const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

                return (
                  <tr
                    key={insight.id}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9fafb'
                    }}
                  >
                    <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                      {insight.date_start}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}>
                        {insight.level.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                      {impressions.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                      {clicks.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                      ${spend.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                      {ctr.toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {insights.length > 50 && (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            color: '#6b7280',
            fontSize: '0.875rem',
          }}>
            Showing first 50 of {insights.length} entries
          </div>
        )}
      </div>
    </div>
  )
}
