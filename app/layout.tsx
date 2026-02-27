import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { Toaster } from '@/providers/Toaster'
import { OfflineProvider } from '@/providers/OfflineProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TipJars - Budget in Style',
  description: 'Smart budgeting for barbers and beauty professionals',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TipJars',
  },
}

export const viewport: Viewport = {
  themeColor: '#18181b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <OfflineProvider>
            {children}
          </OfflineProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
