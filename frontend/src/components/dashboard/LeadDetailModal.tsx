/**
 * LeadDetailModal Component
 * Shows lead field_data in a modal overlay
 */

interface Lead {
  id: string
  lead_id: string
  created_time: string
  field_data: Array<{ name: string; values: string[] }>
  ad_id: string
  ad_name: string
  adset_id: string
  adset_name: string
  campaign_id: string
  campaign_name: string
  form_name: string
  is_organic: boolean
  platform: string
}

interface LeadDetailModalProps {
  lead: Lead
  onClose: () => void
}

export default function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#1f2937' }}>
            Lead Details
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>

        {/* Meta info */}
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.75rem',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          fontSize: '0.8125rem',
          color: '#6b7280',
        }}>
          <div>Created: {new Date(lead.created_time).toLocaleString()}</div>
          <div>Form: {lead.form_name}</div>
          {lead.campaign_name && <div>Campaign: {lead.campaign_name}</div>}
          {lead.ad_name && <div>Ad: {lead.ad_name}</div>}
          {lead.platform && <div>Platform: {lead.platform}</div>}
          {lead.is_organic && <div>Source: Organic</div>}
        </div>

        {/* Field data */}
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#374151' }}>
          Form Fields
        </h4>
        {lead.field_data && lead.field_data.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lead.field_data.map((field, index) => (
              <div
                key={index}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              >
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  color: '#374151',
                  marginBottom: '0.25rem',
                }}>
                  {field.name}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#1f2937',
                }}>
                  {field.values?.join(', ') || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No field data available.</p>
        )}
      </div>
    </div>
  )
}
