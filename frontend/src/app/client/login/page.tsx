'use client'

import Link from 'next/link'

export default function ClientLoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1a1a1a',
              textDecoration: 'none',
              marginBottom: '0.5rem',
              display: 'block'
            }}
          >
            SmartMoney
          </Link>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#0070f3',
            margin: 0
          }}>
            Client Login
          </h2>
        </div>

        {/* Coming Soon Notice */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f0f7ff',
          borderRadius: '8px',
          border: '1px solid #0070f3',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            margin: 0,
            color: '#0070f3',
            fontWeight: '600',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            🚧 Authentication Coming in FAZA 2
          </p>
          <p style={{
            margin: '0.5rem 0 0 0',
            color: '#666',
            fontSize: '0.75rem',
            textAlign: 'center'
          }}>
            Client login will be implemented in the next phase
          </p>
        </div>

        {/* Info Box */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#fff8e6',
          borderRadius: '6px',
          border: '1px solid #ffc107',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            margin: 0,
            fontSize: '0.8rem',
            color: '#856404',
            lineHeight: '1.5'
          }}>
            <strong>Note:</strong> Client accounts are created by your agency.
            You will receive login credentials via email from your agency.
          </p>
        </div>

        {/* Placeholder Form */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#333'
            }}>
              Email
            </label>
            <input
              type="email"
              disabled
              placeholder="client@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '0.875rem',
                backgroundColor: '#f5f5f5'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#333'
            }}>
              Password
            </label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '0.875rem',
                backgroundColor: '#f5f5f5'
              }}
            />
          </div>

          <button
            type="button"
            disabled
            style={{
              padding: '0.875rem',
              backgroundColor: '#ddd',
              color: '#999',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'not-allowed',
              marginTop: '0.5rem'
            }}
          >
            Login (Coming Soon)
          </button>
        </form>

        {/* Footer Links */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #eee',
          textAlign: 'center'
        }}>
          <Link
            href="/"
            style={{
              fontSize: '0.875rem',
              color: '#0070f3',
              textDecoration: 'none'
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
