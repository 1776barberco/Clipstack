import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { Toaster } from '@/providers/Toaster'
import { OfflineProvider } from '@/providers/OfflineProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TipJars — Smart Money Management for Barbers & Stylists',
  description: 'Split your tips, track expenses, and build savings — all in one app built for beauty professionals.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TipJars',
  },
}

export const viewport: Viewport = {
  themeColor: '#18181b',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <OfflineProvider>
              {children}
            </OfflineProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
