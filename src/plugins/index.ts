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
import { hideFromNonAdmins } from '@/access/hideFromNonAdmins'
import { createS3CollectionConfig, normalizePathSegment } from '@/utilities/uploadStorage'

import { Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

// Normalize S3-related environment variables to ensure we never pass empty strings.
const s3Bucket = process.env.S3_BUCKET || undefined
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || undefined
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || undefined

const generateTitle: GenerateTitle<Post> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const parsePublicHTTPURL = (value: string | null | undefined): URL | undefined => {
  const trimmedValue = value?.trim()
  if (!trimmedValue) return undefined

  try {
    const url = new URL(trimmedValue)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return undefined
    }

    url.hash = ''
    return url
  } catch {
    return undefined
  }
}

const getURLHostname = (value: string | null | undefined): string | undefined => {
  const url = parsePublicHTTPURL(value)
  return url?.hostname.toLowerCase()
}

const s3Endpoint = process.env.S3_ENDPOINT
const s3EndpointHostname = getURLHostname(s3Endpoint)
const isCloudflareR2Endpoint =
  s3EndpointHostname === 'r2.cloudflarestorage.com' ||
  s3EndpointHostname?.endsWith('.r2.cloudflarestorage.com') === true
const s3Region = process.env.S3_REGION || (isCloudflareR2Endpoint ? 'auto' : undefined)
const s3PublicURL = parsePublicHTTPURL(process.env.S3_PUBLIC_URL)?.toString()
const rawS3MediaPrefix = normalizePathSegment(process.env.S3_MEDIA_PREFIX)
const s3MediaPrefix = rawS3MediaPrefix ?? ''
const s3CredentialsConfigured = Boolean(s3Bucket && s3AccessKeyId && s3SecretAccessKey && s3Region)
const s3StorageEnabled = process.env.S3_STORAGE_ENABLED !== 'false' && s3CredentialsConfigured

if (s3StorageEnabled) {
  if (!s3Bucket) {
    throw new Error('S3_STORAGE is enabled but S3_BUCKET is not set or is empty')
  }
  if (!s3AccessKeyId) {
    throw new Error('S3_STORAGE is enabled but S3_ACCESS_KEY_ID is not set or is empty')
  }
  if (!s3SecretAccessKey) {
    throw new Error('S3_STORAGE is enabled but S3_SECRET_ACCESS_KEY is not set or is empty')
  }
}

const s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE
  ? process.env.S3_FORCE_PATH_STYLE === 'true'
  : isCloudflareR2Endpoint
const s3ClientUploads = process.env.S3_CLIENT_UPLOADS === 'true'
const mediaS3CollectionConfig = createS3CollectionConfig({
  basePrefix: s3MediaPrefix,
  publicURL: s3PublicURL,
})
const notebookS3CollectionConfig = createS3CollectionConfig({
  basePrefix: s3MediaPrefix,
  publicURL: s3PublicURL,
  subdir: 'notebooks',
})

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['posts', 'people', 'news', 'research', 'wiki', 'activities', 'announcements'],
    overrides: {
      admin: {
        hidden: hideFromNonAdmins,
      },
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
      admin: {
        hidden: hideFromNonAdmins,
      },
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
    formSubmissionOverrides: {
      admin: {
        hidden: hideFromNonAdmins,
      },
    },
  }),
  searchPlugin({
    collections: ['posts', 'news', 'wiki'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      admin: {
        hidden: hideFromNonAdmins,
      },
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  ...(s3StorageEnabled
    ? [
        s3Storage({
          bucket: s3Bucket as string,
          collections: {
            media: mediaS3CollectionConfig,
            notebooks: notebookS3CollectionConfig,
          },
          config: {
            credentials: {
              accessKeyId: s3AccessKeyId as string,
              secretAccessKey: s3SecretAccessKey as string,
            },
            ...(s3Region ? { region: s3Region } : {}),
            ...(s3Endpoint ? { endpoint: s3Endpoint } : {}),
            forcePathStyle: s3ForcePathStyle,
          },
          ...(s3ClientUploads ? { clientUploads: true } : {}),
        }),
      ]
    : []),
]
