'use client'

interface AgencyDashboardSkeletonProps {
  darkMode: boolean
}

export default function AgencyDashboardSkeleton({ darkMode }: AgencyDashboardSkeletonProps) {
  const skeletonBaseColor = darkMode ? '#27272a' : '#e5e7eb'
  const skeletonShimmerColor = darkMode ? '#3f3f46' : '#f3f4f6'
  const cardBg = darkMode ? '#27272a' : 'white'
  const containerBg = darkMode ? '#1a1a1a' : '#f8f9fa'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: containerBg,
      padding: '40px 20px',
      transition: 'background-color 0.2s ease'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Skeleton */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            width: '300px',
            height: '40px',
            backgroundColor: skeletonBaseColor,
            borderRadius: '8px',
            marginBottom: '12px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <div style={{
            width: '200px',
            height: '20px',
            backgroundColor: skeletonBaseColor,
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.1s'
          }} />
        </div>

        {/* Platform Integrations Skeleton */}
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'background-color 0.2s ease'
        }}>
          <div style={{
            width: '200px',
            height: '24px',
            backgroundColor: skeletonBaseColor,
            borderRadius: '4px',
            marginBottom: '24px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                border: `2px solid ${skeletonBaseColor}`,
                borderRadius: '8px',
                padding: '20px',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }}>
                <div style={{
                  width: '120px',
                  height: '20px',
                  backgroundColor: skeletonBaseColor,
                  borderRadius: '4px',
                  marginBottom: '12px'
                }} />
                <div style={{
                  width: '80px',
                  height: '16px',
                  backgroundColor: skeletonBaseColor,
                  borderRadius: '4px'
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* Clients Skeleton */}
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'background-color 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '150px',
              height: '24px',
              backgroundColor: skeletonBaseColor,
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{
              width: '120px',
              height: '40px',
              backgroundColor: skeletonBaseColor,
              borderRadius: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: '0.1s'
            }} />
          </div>

          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '16px',
            padding: '12px 16px',
            borderBottom: `1px solid ${skeletonBaseColor}`,
            marginBottom: '12px'
          }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: '80px',
                height: '16px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.05}s`
              }} />
            ))}
          </div>

          {/* Table Rows */}
          {[1, 2, 3].map(row => (
            <div key={row} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: '16px',
              padding: '16px',
              borderBottom: `1px solid ${skeletonBaseColor}`,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${row * 0.1}s`
            }}>
              <div>
                <div style={{
                  width: '200px',
                  height: '16px',
                  backgroundColor: skeletonBaseColor,
                  borderRadius: '4px',
                  marginBottom: '8px'
                }} />
                <div style={{
                  width: '150px',
                  height: '14px',
                  backgroundColor: skeletonBaseColor,
                  borderRadius: '4px'
                }} />
              </div>
              <div style={{
                width: '60px',
                height: '24px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '12px'
              }} />
              <div style={{
                width: '60px',
                height: '24px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '12px'
              }} />
              <div style={{
                width: '80px',
                height: '32px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '6px'
              }} />
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
