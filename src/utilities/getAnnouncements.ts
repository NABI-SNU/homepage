import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import type { Announcement } from '@/payload-types'

const disableCache = process.env.E2E_DISABLE_CACHE === 'true'

type PublishedAnnouncementListItem = Pick<
  Announcement,
  'description' | 'id' | 'image' | 'meta' | 'publishedAt' | 'slug' | 'title'
>

type PublishedAnnouncementDetail = Pick<
  Announcement,
  | 'content'
  | 'description'
  | 'id'
  | 'image'
  | 'meta'
  | 'publishedAt'
  | 'references'
  | 'slug'
  | 'title'
>

const publishedAnnouncementsWhere = {
  _status: {
    equals: 'published' as const,
  },
}
const announcementListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  publishedAt: true,
  image: true,
  meta: true,
} as const
const announcementDetailSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  publishedAt: true,
  image: true,
  content: true,
  references: true,
  meta: true,
} as const
const announcementSlugSelect = {
  slug: true,
} as const

const normalizeAnnouncementSlug = (slug: string): string => slug.trim()

const getAnnouncementsList = async (): Promise<PublishedAnnouncementListItem[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'announcements',
    depth: 1,
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: announcementListSelect,
    sort: '-publishedAt',
    where: publishedAnnouncementsWhere,
  })

  return result.docs as PublishedAnnouncementListItem[]
}

const getAnnouncementSlugs = async (): Promise<string[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'announcements',
    depth: 0,
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: announcementSlugSelect,
    sort: '-publishedAt',
    where: publishedAnnouncementsWhere,
  })

  return result.docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}

const getPublishedAnnouncementBySlug = async (
  slug: string,
): Promise<PublishedAnnouncementDetail | null> => {
  const payload = await getPayload({ config: configPromise })
  const normalizedSlug = normalizeAnnouncementSlug(slug)
  const result = await payload.find({
    collection: 'announcements',
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: announcementDetailSelect,
    where: {
      and: [
        publishedAnnouncementsWhere,
        {
          slug: {
            equals: normalizedSlug,
          },
        },
      ],
    },
  })

  return (result.docs[0] as PublishedAnnouncementDetail | undefined) || null
}

export const getCachedAnnouncementsList = () =>
  disableCache
    ? () => getAnnouncementsList()
    : unstable_cache(getAnnouncementsList, ['announcements-list'], {
        revalidate: 3600,
        tags: ['announcements_list'],
      })

export const getCachedAnnouncementSlugs = () =>
  disableCache
    ? () => getAnnouncementSlugs()
    : unstable_cache(getAnnouncementSlugs, ['announcements-slugs'], {
        revalidate: 3600,
        tags: ['announcements_slugs', 'site-sitemap'],
      })

export const getCachedPublishedAnnouncementBySlug = (slug: string) => {
  const normalizedSlug = normalizeAnnouncementSlug(slug)

  return disableCache
    ? () => getPublishedAnnouncementBySlug(normalizedSlug)
    : unstable_cache(
        () => getPublishedAnnouncementBySlug(normalizedSlug),
        ['announcement-by-slug', normalizedSlug],
        {
          revalidate: 3600,
          tags: [`announcement_${normalizedSlug}`],
        },
      )
}
