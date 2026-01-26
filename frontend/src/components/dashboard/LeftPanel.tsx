/**
 * LeftPanel Component
 * Displays list of ad accounts with status indicators
 */

interface AdAccount {
  id: string
  name: string
  currency: string
  account_status: number
  status_display: string
}

interface LeftPanelProps {
  accounts: AdAccount[]
  selectedAccount: string | null
  onSelectAccount: (accountId: string) => void
  loading?: boolean
}

export default function LeftPanel({
  accounts,
  selectedAccount,
  onSelectAccount,
  loading = false,
}: LeftPanelProps) {
  const getStatusIcon = (status: number) => {
    switch (status) {
      case 1: return '✓' // ACTIVE
      case 2: return '⏸' // DISABLED
      case 101: return '✗' // CLOSED
      default: return '○'
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return '#10b981' // green
      case 2: return '#f59e0b' // yellow
      case 101: return '#ef4444' // red
      default: return '#6b7280' // gray
    }
  }

  if (loading) {
    return (
      <div style={{
        width: '280px',
        borderRight: '1px solid #e5e7eb',
        padding: '1rem',
        backgroundColor: '#f9fafb',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
          AD ACCOUNTS
        </h3>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div style={{
        width: '280px',
        borderRight: '1px solid #e5e7eb',
        padding: '1rem',
        backgroundColor: '#f9fafb',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
          AD ACCOUNTS
        </h3>
        <div style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '0.875rem',
        }}>
          No ad accounts available
        </div>
      </div>
    )
  }

  return (
    <div className="scrollbar-hidden" style={{
      height: '100%',
      backgroundColor: '#f9fafb',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '1rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
          AD ACCOUNTS
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {accounts.map((account) => {
            const isSelected = selectedAccount === account.id

            return (
              <button
                key={account.id}
                onClick={() => onSelectAccount(account.id)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: isSelected ? '#3b82f6' : 'white',
                  color: isSelected ? 'white' : '#1f2937',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
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
                  <span style={{
                    fontSize: '1rem',
                    color: getStatusColor(account.account_status),
                  }}>
                    {getStatusIcon(account.account_status)}
                  </span>
                  <span style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                  }}>
                    {account.name}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: isSelected ? 'rgba(255, 255, 255, 0.8)' : '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {account.id}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: isSelected ? 'rgba(255, 255, 255, 0.7)' : '#9ca3af',
                  marginTop: '0.25rem',
                }}>
                  {account.currency} • {account.status_display}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
