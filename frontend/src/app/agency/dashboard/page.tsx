'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function AgencyDashboardPage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/agency/login')
    } else if (!loading && user && user.user_type !== 'agency') {
      // User is not an agency, redirect
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || user.user_type !== 'agency') {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Agency Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Welcome back, {user.first_name || user.email}
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Agency Info Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Agency Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <strong>Agency Name:</strong>
              <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>
                {user.agency?.name || 'N/A'}
              </p>
            </div>
            <div>
              <strong>Email:</strong>
              <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>
                {user.agency?.email || user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div style={{
          backgroundColor: '#fff8e6',
          borderRadius: '8px',
          padding: '1.5rem',
          border: '1px solid #ffc107',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>
            🚧 Agency Dashboard Coming in FAZA 3
          </h3>
          <p style={{ margin: 0, color: '#856404' }}>
            Client management, platform integrations, and permissions will be available in the next phase.
          </p>
        </div>

        {/* Quick Links */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              color: '#0070f3',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
