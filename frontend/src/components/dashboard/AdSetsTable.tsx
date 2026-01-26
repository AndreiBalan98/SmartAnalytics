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
  start_time: string | null
  end_time: string | null
}

interface AdSetsTableProps {
  adsets: AdSet[]
  loading?: boolean
  selectedAdSets: string[]
  onSelectAdSets: (adsets: string[]) => void
}

export default function AdSetsTable({
  adsets,
  loading = false,
  selectedAdSets,
  onSelectAdSets,
}: AdSetsTableProps) {
  // Handler pentru toggle individual ad set
  const toggleAdSet = (adsetId: string) => {
    if (selectedAdSets.includes(adsetId)) {
      onSelectAdSets(selectedAdSets.filter(id => id !== adsetId))
    } else {
      onSelectAdSets([...selectedAdSets, adsetId])
    }
  }

  // Handler pentru select all
  const toggleSelectAll = () => {
    if (selectedAdSets.length === adsets.length) {
      onSelectAdSets([])
    } else {
      onSelectAdSets(adsets.map(a => a.id))
    }
  }

  const allSelected = adsets.length > 0 && selectedAdSets.length === adsets.length
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' ' + date.toLocaleTimeString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    })
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
            <th style={{ padding: '0.75rem', width: '50px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#3b82f6',
                }}
              />
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Status
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Nume Ad Set
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
              Daily Budget
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>
              Lifetime Budget
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Start Time
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              End Time
            </th>
          </tr>
        </thead>
        <tbody>
          {adsets.map((adset, index) => {
            const isSelected = selectedAdSets.includes(adset.id)

            return (
              <tr
                key={adset.id}
                title={`Optimization Goal: ${adset.optimization_goal || 'N/A'} | ID: ${adset.id}`}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => toggleAdSet(adset.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9fafb'
                }}
              >
                <td style={{ padding: '0.75rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleAdSet(adset.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: '#3b82f6',
                    }}
                  />
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <StatusBadge status={adset.status} />
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 500, color: '#1f2937' }}>
                  {adset.name}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                  {formatBudget(adset.daily_budget)}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                  {formatBudget(adset.lifetime_budget)}
                </td>
                <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                  {formatDate(adset.start_time)}
                </td>
                <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.75rem' }}>
                  {formatDate(adset.end_time)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
