/**
 * StatusBadge Component
 * Displays status with color coding (active/paused/deleted/etc.)
 */

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Handle null, undefined, or non-string status
  if (!status || typeof status !== 'string') {
    return (
      <span
        className="px-2 py-1 rounded text-xs font-medium border bg-gray-100 text-gray-800 border-gray-300"
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
        }}
      >
        UNKNOWN
      </span>
    )
  }

  const statusLower = status.toLowerCase()

  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-300',
    paused: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    deleted: 'bg-red-100 text-red-800 border-red-300',
    archived: 'bg-gray-100 text-gray-800 border-gray-300',
    ended: 'bg-gray-100 text-gray-800 border-gray-300',
    pending: 'bg-blue-100 text-blue-800 border-blue-300',
  }

  const colorClass = colors[statusLower] || 'bg-gray-100 text-gray-800 border-gray-300'

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium border ${colorClass}`}
      style={{
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {status.toUpperCase()}
    </span>
  )
}
