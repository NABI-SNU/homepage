import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { s3Storage } from '@payloadcms/storage-s3'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const s3Endpoint = process.env.S3_ENDPOINT
const s3Region = process.env.S3_REGION || (s3Endpoint?.includes('r2.cloudflarestorage.com') ? 'auto' : undefined)
const s3PublicURL = process.env.S3_PUBLIC_URL?.trim()
const normalizePathSegment = (value: string | null | undefined): string =>
  (value || '').trim().replace(/^\/+|\/+$/g, '')
const s3MediaPrefix = normalizePathSegment(process.env.S3_MEDIA_PREFIX)
const s3CredentialsConfigured = Boolean(
  process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && s3Region,
)
const s3StorageEnabled = process.env.S3_STORAGE_ENABLED !== 'false' && s3CredentialsConfigured
const s3ForcePathStyle =
  process.env.S3_FORCE_PATH_STYLE === 'true' ||
  (!process.env.S3_FORCE_PATH_STYLE && Boolean(s3Endpoint?.includes('r2.cloudflarestorage.com')))
const s3ClientUploads = process.env.S3_CLIENT_UPLOADS === 'true'
const joinPublicBaseAndPath = (baseURL: string, path: string): string => {
  const normalizedPath = normalizePathSegment(path)
  const normalizedBaseURL = baseURL.replace(/\/+$/, '')

  try {
    const url = new URL(normalizedBaseURL)
    const basePath = normalizePathSegment(url.pathname)
    const fullPath =
      basePath && normalizedPath !== basePath && !normalizedPath.startsWith(`${basePath}/`)
        ? `${basePath}/${normalizedPath}`
        : normalizedPath

    url.pathname = `/${fullPath}`
    return url.toString()
  } catch {
    return `${normalizedBaseURL}/${normalizedPath}`
  }
}
const s3GenerateFileURL = s3PublicURL
  ? ({ filename, prefix }: { filename: string; prefix?: string }) => {
      const normalizedPrefix = normalizePathSegment(prefix) || s3MediaPrefix
      const encodedFilename = encodeURIComponent(filename)
      const pathname = normalizedPrefix ? `${normalizedPrefix}/${encodedFilename}` : encodedFilename

      return joinPublicBaseAndPath(s3PublicURL, pathname)
    }
  : undefined
const mediaS3CollectionConfig =
  s3GenerateFileURL || s3MediaPrefix
    ? {
        ...(s3MediaPrefix ? { prefix: s3MediaPrefix } : {}),
        ...(s3GenerateFileURL ? { generateFileURL: s3GenerateFileURL } : {}),
      }
    : true

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['posts', 'people', 'news', 'research', 'activities'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts', 'news'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  ...(s3StorageEnabled
    ? [
        s3Storage({
          bucket: process.env.S3_BUCKET!,
          collections: {
            media: mediaS3CollectionConfig,
          },
          config: {
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID!,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
            region: s3Region!,
            ...(s3Endpoint ? { endpoint: s3Endpoint } : {}),
            forcePathStyle: s3ForcePathStyle,
          },
          ...(s3ClientUploads ? { clientUploads: true } : {}),
        }),
      ]
    : []),
]
