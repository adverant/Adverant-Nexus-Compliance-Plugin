import type { Metadata } from 'next'
import { Inter, Urbanist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ToastProvider } from '@/components/toast'

const inter = Inter({
  subsets: ['latin'],
  fallback: ['system-ui', 'arial'],
  display: 'swap',
  variable: '--font-inter',
})

const urbanist = Urbanist({
  subsets: ['latin'],
  fallback: ['system-ui', 'arial'],
  display: 'swap',
  variable: '--font-urbanist',
})

// Build info for deployment tracking
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'development'
const BUILD_TIMESTAMP = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString()
const GIT_COMMIT = process.env.NEXT_PUBLIC_GIT_COMMIT || 'local'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Compliance Engine | Nexus',
    template: '%s | Compliance Engine',
  },
  description: 'Enterprise Compliance Engine with 688+ controls across 6 frameworks, Z-Inspection integration, and AI-powered assessments.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${urbanist.variable}`} suppressHydrationWarning>
      <head>
        <meta name="build-id" content={BUILD_ID} />
        <meta name="build-timestamp" content={BUILD_TIMESTAMP} />
        <meta name="git-commit" content={GIT_COMMIT} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
