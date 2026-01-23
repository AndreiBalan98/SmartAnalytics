/**
 * RightPanel Component
 * Navigation menu for different views (Campaigns, Ad Sets, Ads, Creatives, Insights)
 */

interface RightPanelProps {
  selectedView: string
  onSelectView: (view: string) => void
  disabled?: boolean
}

export default function RightPanel({
  selectedView,
  onSelectView,
  disabled = false,
}: RightPanelProps) {
  const navItems = [
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
    <div style={{
      width: '240px',
      borderLeft: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      padding: '1rem',
      overflowY: 'auto',
    }}>
      <h3 style={{
        margin: '0 0 1rem 0',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#6b7280',
      }}>
        NAVIGATION
      </h3>

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
