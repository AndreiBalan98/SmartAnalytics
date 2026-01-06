import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meta Ads Integration',
  description: 'Internal MVP for Meta Ads management',
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
        padding: '2rem', 
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        {children}
      </body>
    </html>
  )
}