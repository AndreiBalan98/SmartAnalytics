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

interface SelectionItem {
  id: string
  name: string
  ad_account_id: string
}

interface AdSetsTableProps {
  adsets: AdSet[]
  loading?: boolean
  accountId: string | null
  selectedAdSets: SelectionItem[]
  onSelectAdSets: (adsets: SelectionItem[]) => void
}

export default function AdSetsTable({
  adsets,
  loading = false,
  accountId,
  selectedAdSets,
  onSelectAdSets,
}: AdSetsTableProps) {
  // Sortare ad sets: ACTIVE primele, apoi PAUSED, apoi restul
  const sortedAdSets = [...adsets].sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      'ACTIVE': 0,
      'PAUSED': 1,
    }
    const aOrder = statusOrder[a.status] ?? 999
    const bOrder = statusOrder[b.status] ?? 999
    return aOrder - bOrder
  })

  // Get selected IDs for current account
  const selectedIdsInCurrentAccount = selectedAdSets
    .filter(a => a.ad_account_id === accountId)
    .map(a => a.id)

  // Handler pentru toggle individual ad set
  const toggleAdSet = (adset: AdSet) => {
    const isSelected = selectedIdsInCurrentAccount.includes(adset.id)

    if (isSelected) {
      // Remove from selections
      onSelectAdSets(selectedAdSets.filter(a => a.id !== adset.id))
    } else {
      // Add to selections with full info
      onSelectAdSets([
        ...selectedAdSets,
        {
          id: adset.id,
          name: adset.name,
          ad_account_id: accountId || '',
        },
      ])
    }
  }

  // Handler pentru select all (only for current account)
  const toggleSelectAll = () => {
    if (selectedIdsInCurrentAccount.length === sortedAdSets.length) {
      // Deselect all from current account
      onSelectAdSets(
        selectedAdSets.filter(a => a.ad_account_id !== accountId)
      )
    } else {
      // Select all from current account
      const allFromCurrentAccount = sortedAdSets.map(a => ({
        id: a.id,
        name: a.name,
        ad_account_id: accountId || '',
      }))
      // Keep selections from other accounts and add all from current
      const otherAccountSelections = selectedAdSets.filter(
        a => a.ad_account_id !== accountId
      )
      onSelectAdSets([...otherAccountSelections, ...allFromCurrentAccount])
    }
  }

  const allSelected = sortedAdSets.length > 0 && selectedIdsInCurrentAccount.length === sortedAdSets.length
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading ad sets...
      </div>
    )
  }

  if (sortedAdSets.length === 0) {
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
          {sortedAdSets.map((adset, index) => {
            const isSelected = selectedIdsInCurrentAccount.includes(adset.id)

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
                onClick={() => toggleAdSet(adset)}
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
                    onChange={() => toggleAdSet(adset)}
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
