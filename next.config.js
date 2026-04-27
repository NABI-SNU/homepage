import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const IMAGE_REMOTE_SOURCES = [
  process.env.NEXT_PUBLIC_SERVER_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
  process.env.__NEXT_PRIVATE_ORIGIN,
  process.env.S3_PUBLIC_URL,
  process.env.S3_ENDPOINT,
  'https://www.gravatar.com',
  'https://secure.gravatar.com',
  'https://images.unsplash.com',
].filter(Boolean)
const IS_E2E_ENV = process.env.E2E_DISABLE_CACHE === 'true'

const IMAGE_REMOTE_PATTERNS = Array.from(new Set(IMAGE_REMOTE_SOURCES)).flatMap((item) => {
  try {
    const url = new URL(item)

    return [
      {
        hostname: url.hostname,
        protocol: url.protocol.replace(':', ''),
        ...(url.port ? { port: url.port } : {}),
      },
    ]
  } catch {
    return []
  }
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/api/notebooks/file/**',
      },
    ],
    qualities: [75, 82],
    remotePatterns: IMAGE_REMOTE_PATTERNS,
    ...(IS_E2E_ENV ? { unoptimized: true } : {}),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
