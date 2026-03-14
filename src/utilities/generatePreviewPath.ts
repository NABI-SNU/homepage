import { CollectionSlug, PayloadRequest } from 'payload'

export const previewCollectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  announcements: '/announcements',
  posts: '/posts',
  news: '/news',
  research: '/labs',
  wiki: '/wiki',
}

export type PreviewableCollection = keyof typeof previewCollectionPrefixMap

type Props = {
  collection: PreviewableCollection
  slug: string
  req: PayloadRequest
}

export const getPreviewTargetPath = ({
  collection,
  slug,
}: {
  collection: PreviewableCollection
  slug: string
}): string | null => {
  // Allow empty strings, e.g. for the homepage
  if (slug === undefined || slug === null) {
    return null
  }

  // Encode to support slugs with special characters
  const encodedSlug = encodeURIComponent(slug)
  const prefix = previewCollectionPrefixMap[collection]
  if (!prefix) return null

  return `${prefix}/${encodedSlug}`
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  const path = getPreviewTargetPath({ collection, slug })
  if (!path) return null

  const encodedParams = new URLSearchParams({
    slug,
    collection,
    path,
  })

  const url = `/next/preview?${encodedParams.toString()}`

  return url
}
