import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'ConversionDriven – Atribuire care chiar funcționează',
  description: 'Înțelege exact de unde provin conversiile tale',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          /* Global dark mode styles */
          html, body {
            margin: 0;
            padding: 0;
            font-family: system-ui, sans-serif;
            background-color: #f8f9fa;
            transition: background-color 0.2s ease;
          }

          html.dark, html.dark body {
            background-color: #1a1a1a;
            color: #f3f4f6;
          }

          /* Smooth transitions for dark mode */
          * {
            transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          }
        `}</style>
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}