'use client'

import { useEffect, useState } from 'react'

interface HealthResponse {
  status: string
  service: string
  mock_mode: boolean
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Meta Ads Integration MVP</h1>
      
      <div style={{
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        marginTop: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2>Backend Health Check</h2>
        
        {loading && <p>Loading...</p>}
        
        {error && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fee', 
            borderRadius: '4px',
            color: '#c00'
          }}>
            Error: {error}
          </div>
        )}
        
        {health && (
          <div>
            <p><strong>Status:</strong> {health.status}</p>
            <p><strong>Service:</strong> {health.service}</p>
            <p><strong>Mock Mode:</strong> {health.mock_mode ? 'Enabled' : 'Disabled'}</p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', color: '#666' }}>
        <p>📍 Next steps:</p>
        <ul>
          <li>✅ Backend health check working</li>
          <li>⏳ Settings page (Milestone 1 - Step 2)</li>
          <li>⏳ Dashboard page (Milestone 1 - Step 3)</li>
        </ul>
      </div>
    </div>
  )
}