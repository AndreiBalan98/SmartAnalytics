/**
 * CampaignsTable Component
 * Displays campaigns in table format
 */

import StatusBadge from '@/components/ui/StatusBadge'

interface Campaign {
  id: string
  name: string
  objective: string
  status: string
  buying_type: string
  created_at: string
}

interface SelectionItem {
  id: string
  name: string
  ad_account_id: string
}

interface CampaignsTableProps {
  campaigns: Campaign[]
  loading?: boolean
  accountId: string | null
  selectedCampaigns: SelectionItem[]
  onSelectCampaigns: (campaigns: SelectionItem[]) => void
}

export default function CampaignsTable({
  campaigns,
  loading = false,
  accountId,
  selectedCampaigns,
  onSelectCampaigns,
}: CampaignsTableProps) {
  // Sortare campanii: ACTIVE primele, apoi PAUSED, apoi restul
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const statusOrder: { [key: string]: number } = {
      'ACTIVE': 0,
      'PAUSED': 1,
    }
    const aOrder = statusOrder[a.status] ?? 999
    const bOrder = statusOrder[b.status] ?? 999
    return aOrder - bOrder
  })

  // Get selected IDs for current account
  const selectedIdsInCurrentAccount = selectedCampaigns
    .filter(c => c.ad_account_id === accountId)
    .map(c => c.id)

  // Handler pentru toggle individual campaign
  const toggleCampaign = (campaign: Campaign) => {
    const isSelected = selectedIdsInCurrentAccount.includes(campaign.id)

    if (isSelected) {
      // Remove from selections
      onSelectCampaigns(selectedCampaigns.filter(c => c.id !== campaign.id))
    } else {
      // Add to selections with full info
      onSelectCampaigns([
        ...selectedCampaigns,
        {
          id: campaign.id,
          name: campaign.name,
          ad_account_id: accountId || '',
        },
      ])
    }
  }

  // Handler pentru select all (only for current account)
  const toggleSelectAll = () => {
    if (selectedIdsInCurrentAccount.length === sortedCampaigns.length) {
      // Deselect all from current account
      onSelectCampaigns(
        selectedCampaigns.filter(c => c.ad_account_id !== accountId)
      )
    } else {
      // Select all from current account
      const allFromCurrentAccount = sortedCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        ad_account_id: accountId || '',
      }))
      // Keep selections from other accounts and add all from current
      const otherAccountSelections = selectedCampaigns.filter(
        c => c.ad_account_id !== accountId
      )
      onSelectCampaigns([...otherAccountSelections, ...allFromCurrentAccount])
    }
  }

  const allSelected = sortedCampaigns.length > 0 && selectedIdsInCurrentAccount.length === sortedCampaigns.length
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading campaigns...
      </div>
    )
  }

  if (sortedCampaigns.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#9ca3af',
      }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Campaigns Found</p>
        <p style={{ fontSize: '0.875rem' }}>This ad account has no campaigns yet.</p>
      </div>
    )
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
              Nume Campaign
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Obiectiv
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCampaigns.map((campaign, index) => {
            const isSelected = selectedIdsInCurrentAccount.includes(campaign.id)

            return (
              <tr
                key={campaign.id}
                title={`Buying Type: ${campaign.buying_type || 'N/A'} | ID: ${campaign.id}`}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => toggleCampaign(campaign)}
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
                    onChange={() => toggleCampaign(campaign)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: '#3b82f6',
                    }}
                  />
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <StatusBadge status={campaign.status} />
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 500, color: '#1f2937' }}>
                  {campaign.name}
                </td>
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                  {campaign.objective || 'N/A'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
