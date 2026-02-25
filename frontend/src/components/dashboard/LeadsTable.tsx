/**
 * LeadsTable Component
 * Displays leads in table format with click-to-open detail modal
 */

import { useState } from 'react'
import LeadDetailModal from './LeadDetailModal'

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

interface LeadsTableProps {
  leads: Lead[]
  loading?: boolean
}

export default function LeadsTable({ leads, loading = false }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading leads...
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#9ca3af',
      }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Leads Found</p>
        <p style={{ fontSize: '0.875rem' }}>No leads are available for your account.</p>
      </div>
    )
  }

  return (
    <>
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
                Created At
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Ad Name
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Ad Set Name
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Campaign Name
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Platform
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                Form Name
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, index) => (
              <tr
                key={lead.lead_id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedLead(lead)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9fafb'
                }}
              >
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                  {new Date(lead.created_time).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 500, color: '#1f2937' }}>
                  {lead.ad_name || (lead.is_organic ? 'Organic' : 'N/A')}
                </td>
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                  {lead.adset_name || 'N/A'}
                </td>
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                  {lead.campaign_name || 'N/A'}
                </td>
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                  {lead.platform || 'N/A'}
                </td>
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                  {lead.form_name || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </>
  )
}
