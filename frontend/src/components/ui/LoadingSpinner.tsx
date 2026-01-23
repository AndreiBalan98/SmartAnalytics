/**
 * LoadingSpinner Component
 * Centered loading spinner with optional message
 */

interface LoadingSpinnerProps {
  message?: string
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '3rem',
      minHeight: '300px',
    }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {message && (
        <p style={{
          marginTop: '1rem',
          color: '#6b7280',
          fontSize: '0.875rem',
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
