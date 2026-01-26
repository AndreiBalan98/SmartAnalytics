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
  creative_name?: string
}

interface AdsTableProps {
  ads: Ad[]
  loading?: boolean
  selectedAds: string[]
  onSelectAds: (ads: string[]) => void
}

export default function AdsTable({
  ads,
  loading = false,
  selectedAds,
  onSelectAds,
}: AdsTableProps) {
  // Handler pentru toggle individual ad
  const toggleAd = (adId: string) => {
    if (selectedAds.includes(adId)) {
      onSelectAds(selectedAds.filter(id => id !== adId))
    } else {
      onSelectAds([...selectedAds, adId])
    }
  }

  // Handler pentru select all
  const toggleSelectAll = () => {
    if (selectedAds.length === ads.length) {
      onSelectAds([])
    } else {
      onSelectAds(ads.map(a => a.id))
    }
  }

  const allSelected = ads.length > 0 && selectedAds.length === ads.length
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
              Nume Ad
            </th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
              Creative
            </th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad, index) => {
            const isSelected = selectedAds.includes(ad.id)
            const creativeName = ad.creative_name || ad.creative_id || 'N/A'

            return (
              <tr
                key={ad.id}
                title={`Effective Status: ${ad.effective_status || 'N/A'} | ID: ${ad.id}`}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => toggleAd(ad.id)}
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
                    onChange={() => toggleAd(ad.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: '#3b82f6',
                    }}
                  />
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <StatusBadge status={ad.status} />
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 500, color: '#1f2937' }}>
                  {ad.name}
                </td>
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                  {creativeName}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
