/**
 * AdsTable Component
 * Displays ads in table format
 */

import StatusBadge from '@/components/ui/StatusBadge'

interface Ad {
  id: string
  name: string
  adset_name: string
  campaign_name: string
  status: string
  effective_status: string
  creative_id: string
}

interface AdsTableProps {
  ads: Ad[]
  loading?: boolean
}

export default function AdsTable({ ads, loading = false }: AdsTableProps) {
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading ads...
      </div>
    )
  }

  if (ads.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#9ca3af',
      }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Ads Found</p>
        <p style={{ fontSize: '0.875rem' }}>This account has no ads yet.</p>
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
              Ad Name
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Ad Set
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Campaign
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Status
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Effective Status
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Creative ID
            </th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad, index) => (
            <tr
              key={ad.id}
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
                {ad.name}
              </td>
              <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                {ad.adset_name || 'N/A'}
              </td>
              <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                {ad.campaign_name || 'N/A'}
              </td>
              <td style={{ padding: '0.75rem' }}>
                <StatusBadge status={ad.status} />
              </td>
              <td style={{ padding: '0.75rem' }}>
                <StatusBadge status={ad.effective_status} />
              </td>
              <td style={{ padding: '0.75rem', color: '#9ca3af', fontSize: '0.75rem' }}>
                {ad.creative_id || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
