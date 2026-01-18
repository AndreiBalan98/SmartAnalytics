'use client'

interface ClientDashboardSkeletonProps {
  darkMode: boolean
}

export default function ClientDashboardSkeleton({ darkMode }: ClientDashboardSkeletonProps) {
  const skeletonBaseColor = darkMode ? '#27272a' : '#e5e7eb'
  const cardBg = darkMode ? '#27272a' : 'white'
  const containerBg = darkMode ? '#1a1a1a' : '#f8f9fa'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: containerBg,
      padding: '40px 20px',
      transition: 'background-color 0.2s ease'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Skeleton */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '250px',
            height: '36px',
            backgroundColor: skeletonBaseColor,
            borderRadius: '8px',
            marginBottom: '12px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <div style={{
            width: '180px',
            height: '20px',
            backgroundColor: skeletonBaseColor,
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
            animationDelay: '0.1s'
          }} />
        </div>

        {/* Date Range Selector Skeleton */}
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'background-color 0.2s ease'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                width: '140px',
                height: '40px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '8px',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }} />
            ))}
          </div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} style={{
              backgroundColor: cardBg,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s ease',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.05}s`
            }}>
              <div style={{
                width: '80px',
                height: '14px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '4px',
                marginBottom: '16px'
              }} />
              <div style={{
                width: '120px',
                height: '32px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '6px'
              }} />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              backgroundColor: cardBg,
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'background-color 0.2s ease',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }}>
              <div style={{
                width: '150px',
                height: '20px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '4px',
                marginBottom: '8px'
              }} />
              <div style={{
                width: '100px',
                height: '14px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '4px',
                marginBottom: '20px'
              }} />
              {/* Chart area */}
              <div style={{
                height: '300px',
                backgroundColor: skeletonBaseColor,
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Animated shimmer effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}, transparent)`,
                  animation: 'shimmer 2s infinite'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Account Breakdown Table Skeleton */}
        <div style={{
          backgroundColor: cardBg,
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'background-color 0.2s ease'
        }}>
          <div style={{
            width: '200px',
            height: '24px',
            backgroundColor: skeletonBaseColor,
            borderRadius: '4px',
            marginBottom: '20px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />

          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '12px',
            padding: '12px 16px',
            borderBottom: `2px solid ${skeletonBaseColor}`,
            marginBottom: '12px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '12px',
              padding: '16px',
              borderBottom: `1px solid ${skeletonBaseColor}`,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${row * 0.1}s`
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(col => (
                <div key={col} style={{
                  width: '70px',
                  height: '16px',
                  backgroundColor: skeletonBaseColor,
                  borderRadius: '4px'
                }} />
              ))}
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

          @keyframes shimmer {
            0% {
              left: -100%;
            }
            100% {
              left: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
