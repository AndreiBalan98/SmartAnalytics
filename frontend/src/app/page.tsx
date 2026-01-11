'use client'

import Link from 'next/link'

export default function Home() {
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
      {/* Main Title */}
      <h1 style={{
        fontSize: 'clamp(3rem, 10vw, 6rem)',
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: '4rem',
        textAlign: 'center',
        letterSpacing: '-0.02em'
      }}>
        SmartMoney
      </h1>

      {/* Connection Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '400px'
      }}>
        <Link
          href="/agency/login"
          style={{
            padding: '1.25rem 2rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            backgroundColor: '#0070f3',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 112, 243, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0051cc'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 112, 243, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#0070f3'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 112, 243, 0.3)'
          }}
        >
          Connect as Agency
        </Link>

        <Link
          href="/client/login"
          style={{
            padding: '1.25rem 2rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            backgroundColor: 'white',
            color: '#0070f3',
            border: '2px solid #0070f3',
            borderRadius: '8px',
            textDecoration: 'none',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f7ff'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          Connect as Client
        </Link>
      </div>

      {/* Footer Note */}
      <p style={{
        marginTop: '3rem',
        fontSize: '0.875rem',
        color: '#666',
        textAlign: 'center'
      }}>
        Smart advertising analytics for agencies and their clients
      </p>
    </div>
  )
}