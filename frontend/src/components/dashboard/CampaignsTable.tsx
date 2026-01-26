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

interface CampaignsTableProps {
  campaigns: Campaign[]
  loading?: boolean
  selectedCampaigns: string[]
  onSelectCampaigns: (campaigns: string[]) => void
}

export default function CampaignsTable({
  campaigns,
  loading = false,
  selectedCampaigns,
  onSelectCampaigns,
}: CampaignsTableProps) {
  // Handler pentru toggle individual campaign
  const toggleCampaign = (campaignId: string) => {
    if (selectedCampaigns.includes(campaignId)) {
      onSelectCampaigns(selectedCampaigns.filter(id => id !== campaignId))
    } else {
      onSelectCampaigns([...selectedCampaigns, campaignId])
    }
  }

  // Handler pentru select all
  const toggleSelectAll = () => {
    if (selectedCampaigns.length === campaigns.length) {
      onSelectCampaigns([])
    } else {
      onSelectCampaigns(campaigns.map(c => c.id))
    }
  }

  const allSelected = campaigns.length > 0 && selectedCampaigns.length === campaigns.length
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading campaigns...
      </div>
    )
  }

  if (campaigns.length === 0) {
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
          {campaigns.map((campaign, index) => {
            const isSelected = selectedCampaigns.includes(campaign.id)

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
                onClick={() => toggleCampaign(campaign.id)}
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
                    onChange={() => toggleCampaign(campaign.id)}
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
