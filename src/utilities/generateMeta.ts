import type { Metadata } from 'next'

import type { Config, Media } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const SITE_TITLE = 'NABI Labs'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/preview.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

type MetaDoc = {
  description?: string | null
  meta?: {
    description?: string | null
    image?: Media | Config['db']['defaultIDType'] | null
    title?: string | null
  } | null
  slug?: string | string[] | null
  title?: string | null
}

const getPathFromDoc = (doc?: MetaDoc | null): string | undefined => {
  const slug = doc?.slug

  if (Array.isArray(slug)) {
    return slug.length > 0 ? `/${slug.join('/')}` : undefined
  }

  if (typeof slug === 'string' && slug.trim()) {
    return `/${slug.trim()}`
  }

  return undefined
}

const normalizeTitle = (value?: string | null) => {
  if (!value) return SITE_TITLE
  if (value.toLowerCase().includes(SITE_TITLE.toLowerCase())) return value
  return `${value} | ${SITE_TITLE}`
}

export const generateMeta = async (args: {
  canonical?: string
  description?: string | null
  doc?: MetaDoc | null
  path?: string
  robots?: Metadata['robots']
  title?: string | null
}): Promise<Metadata> => {
  const { canonical, description, doc, path, robots, title } = args

  const resolvedPath = canonical || path || getPathFromDoc(doc)
  const resolvedDescription = description || doc?.meta?.description || doc?.description || undefined
  const resolvedTitle = normalizeTitle(title || doc?.meta?.title || doc?.title)
  const ogImage = getImageURL(doc?.meta?.image)

  const openGraphURL = resolvedPath || '/'

  return {
    alternates: resolvedPath
      ? {
          canonical: resolvedPath,
        }
      : undefined,
    description: resolvedDescription,
    openGraph: mergeOpenGraph({
      description: resolvedDescription || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title: resolvedTitle,
      url: openGraphURL,
    }),
    robots,
    title: resolvedTitle,
  }
}
