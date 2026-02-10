/**
 * RightPanel Component
 * Navigation menu for different views (Campaigns, Ad Sets, Ads, Creatives, Insights)
 */

interface RightPanelProps {
  selectedView: string
  onSelectView: (view: string) => void
  disabled?: boolean
  selectedCampaignsCount?: number
  selectedAdSetsCount?: number
  selectedAdsCount?: number
  selectedAccountsCount?: number
  onClearAllSelections: () => void
}

export default function RightPanel({
  selectedView,
  onSelectView,
  disabled = false,
  selectedCampaignsCount = 0,
  selectedAdSetsCount = 0,
  selectedAdsCount = 0,
  selectedAccountsCount = 0,
  onClearAllSelections,
}: RightPanelProps) {
  // Calculate total selections
  const totalSelections = (selectedCampaignsCount || 0) +
                          (selectedAdSetsCount || 0) +
                          (selectedAdsCount || 0)

  // Mapping pentru count-uri
  const countMap: { [key: string]: number } = {
    campaigns: selectedCampaignsCount,
    adsets: selectedAdSetsCount,
    ads: selectedAdsCount,
  }
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📋',
      description: 'Complete performance overview',
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: '📊',
      description: 'View all campaigns',
    },
    {
      id: 'adsets',
      label: 'Ad Sets',
      icon: '🎯',
      description: 'View ad sets',
    },
    {
      id: 'ads',
      label: 'Ads',
      icon: '📢',
      description: 'View individual ads',
    },
    {
      id: 'creatives',
      label: 'Creatives',
      icon: '🎨',
      description: 'View ad creatives',
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: '📈',
      description: 'View performance metrics',
    },
  ]

  return (
    <div className="scrollbar-hidden" style={{
      height: '100%',
      backgroundColor: '#f9fafb',
      padding: '1rem',
      overflowY: 'auto',
    }}>
      {/* Selections Summary */}
      {totalSelections > 0 && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          fontSize: '0.75rem',
        }}>
          <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '0.5rem' }}>
            Selecții Salvate
          </div>
          {selectedAccountsCount > 0 && (
            <div style={{ color: '#3b82f6', marginBottom: '0.25rem' }}>
              📊 Conturi: {selectedAccountsCount}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#1e40af' }}>
            {selectedCampaignsCount > 0 && <div>🎯 Campanii: {selectedCampaignsCount}</div>}
            {selectedAdSetsCount > 0 && <div>📢 Ad Sets: {selectedAdSetsCount}</div>}
            {selectedAdsCount > 0 && <div>🎨 Ads: {selectedAdsCount}</div>}
          </div>
          <button
            onClick={onClearAllSelections}
            style={{
              marginTop: '0.5rem',
              padding: '0.375rem 0.625rem',
              width: '100%',
              fontSize: '0.75rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
          >
            × Șterge Tot
          </button>
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <h3 style={{
          margin: 0,
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#6b7280',
        }}>
          NAVIGATION
        </h3>
      </div>

      {disabled && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.75rem',
          color: '#92400e',
        }}>
          Select an ad account to view data
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => {
          const isSelected = selectedView === item.id
          const isDisabled = disabled

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onSelectView(item.id)}
              disabled={isDisabled}
              style={{
                padding: '0.75rem',
                backgroundColor: isSelected ? '#3b82f6' : 'white',
                color: isSelected ? 'white' : isDisabled ? '#d1d5db' : '#1f2937',
                border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                opacity: isDisabled ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isDisabled) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                  e.currentTarget.style.borderColor = '#d1d5db'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isDisabled) {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = '#e5e7eb'
                }
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem',
              }}>
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <span style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}>
                  {item.label}
                  {countMap[item.id] > 0 && (
                    <span style={{
                      marginLeft: '0.5rem',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : '#3b82f6',
                      color: isSelected ? 'white' : 'white',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {countMap[item.id]}
                    </span>
                  )}
                </span>
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: isSelected ? 'rgba(255, 255, 255, 0.8)' : '#6b7280',
                marginLeft: '2rem',
              }}>
                {item.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
