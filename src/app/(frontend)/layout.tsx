import type { Metadata } from 'next'

import '@datalayer/jupyter-react/style'
import { cn } from '@/utilities/ui'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import Script from 'next/script'
import React from 'react'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-inter',
})
const geistMono = localFont({
  adjustFontFallback: false,
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Roboto Mono',
    'Menlo',
    'Monaco',
    'Liberation Mono',
    'DejaVu Sans Mono',
    'Courier New',
    'monospace',
  ],
  preload: false,
  src: '../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
})
const googleAnalyticsID = process.env.NEXT_PUBLIC_GA_ID?.trim() || ''
const enableVercelAnalytics = process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === 'true'
const enableVercelSpeedInsights = process.env.NEXT_PUBLIC_ENABLE_VERCEL_SPEED_INSIGHTS === 'true'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn(inter.variable, geistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        {googleAnalyticsID ? (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAnalyticsID}');`}
            </Script>
          </>
        ) : null}
        <link href="/favicon.ico" rel="shortcut icon" />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
        <link color="#8D46E7" href="/favicon.svg" rel="mask-icon" />
      </head>
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
          {enableVercelAnalytics ? <Analytics /> : null}
          {enableVercelSpeedInsights ? <SpeedInsights /> : null}
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
