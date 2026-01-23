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
}

export default function CampaignsTable({ campaigns, loading = false }: CampaignsTableProps) {
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
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Campaign Name
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Objective
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Status
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Buying Type
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Campaign ID
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign, index) => (
            <tr
              key={campaign.id}
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
                {campaign.name}
              </td>
              <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                {campaign.objective || 'N/A'}
              </td>
              <td style={{ padding: '0.75rem' }}>
                <StatusBadge status={campaign.status} />
              </td>
              <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                {campaign.buying_type || 'N/A'}
              </td>
              <td style={{ padding: '0.75rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                {campaign.id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
