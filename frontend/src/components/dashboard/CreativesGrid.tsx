/**
 * CreativesGrid Component
 * Displays ad creatives in a card/grid layout
 */

interface Creative {
  id: string
  name: string
  image_url: string
  video_url: string
  object_story_spec: any
}

interface CreativesGridProps {
  creatives: Creative[]
  loading?: boolean
}

export default function CreativesGrid({ creatives, loading = false }: CreativesGridProps) {
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
        Loading creatives...
      </div>
    )
  }

  if (creatives.length === 0) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#9ca3af',
      }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Creatives Found</p>
        <p style={{ fontSize: '0.875rem' }}>This account has no ad creatives yet.</p>
      </div>
    )
  }

  const getCreativeType = (creative: Creative) => {
    if (creative.image_url) return 'Image'
    if (creative.video_url) return 'Video'
    if (creative.object_story_spec) return 'Story'
    return 'Unknown'
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Image': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Video': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Story': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem',
      padding: '1rem',
    }}>
      {creatives.map((creative) => {
        const type = getCreativeType(creative)

        return (
          <div
            key={creative.id}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            {/* Thumbnail */}
            <div style={{
              height: '200px',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              {creative.image_url ? (
                <img
                  src={creative.image_url}
                  alt={creative.name || 'Creative'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{
                  fontSize: '3rem',
                  color: '#9ca3af',
                }}>
                  {type === 'Video' ? '🎥' : type === 'Story' ? '📱' : '🖼️'}
                </div>
              )}

              {/* Type badge */}
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
              }}>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getTypeBadgeColor(type)}`}
                  style={{
                    display: 'inline-block',
                  }}
                >
                  {type}
                </span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1rem' }}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#1f2937',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {creative.name || 'Untitled Creative'}
              </h4>
              <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: '#9ca3af',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                ID: {creative.id}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
