import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'SmartMoney - Advertising Analytics',
  description: 'Smart advertising analytics for agencies and their clients',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}