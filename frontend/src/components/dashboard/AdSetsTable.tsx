/**
 * AdSetsTable Component
 * Displays ad sets in table format
 */

import StatusBadge from '@/components/ui/StatusBadge'

interface AdSet {
  id: string
  name: string
  campaign_name: string
  status: string
  daily_budget: string | null
  lifetime_budget: string | null
  optimization_goal: string
}

interface AdSetsTableProps {
  adsets: AdSet[]
  loading?: boolean
}

export default function AdSetsTable({ adsets, loading = false }: AdSetsTableProps) {
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading ad sets...
      </div>
    )
  }

  if (adsets.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#9ca3af',
      }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Ad Sets Found</p>
        <p style={{ fontSize: '0.875rem' }}>This account has no ad sets yet.</p>
      </div>
    )
  }

  const formatBudget = (budget: string | null) => {
    if (!budget) return 'N/A'
    const num = parseFloat(budget)
    return `$${(num / 100).toFixed(2)}`
  }

  return (
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
              Ad Set Name
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Campaign
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Status
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
              Daily Budget
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
              Lifetime Budget
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Optimization
            </th>
          </tr>
        </thead>
        <tbody>
          {adsets.map((adset, index) => (
            <tr
              key={adset.id}
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
                {adset.name}
              </td>
              <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                {adset.campaign_name || 'N/A'}
              </td>
              <td style={{ padding: '0.75rem' }}>
                <StatusBadge status={adset.status} />
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                {formatBudget(adset.daily_budget)}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                {formatBudget(adset.lifetime_budget)}
              </td>
              <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                {adset.optimization_goal || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
