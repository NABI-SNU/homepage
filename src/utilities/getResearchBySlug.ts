import configPromise from '@payload-config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import type { Research, User } from '@/payload-types'

const disableCache = process.env.E2E_DISABLE_CACHE === 'true'

type FindResearchBySlugArgs = {
  depth?: number
  draft: boolean
  payload: Payload
  slug: string
  user?: User | null
}

type PublishedResearchSummary = Pick<
  Research,
  'date' | 'description' | 'id' | 'image' | 'notebook' | 'slug' | 'title'
>

type PublishedResearchDetail = Pick<
  Research,
  'content' | 'date' | 'description' | 'id' | 'image' | 'notebook' | 'slug' | 'title'
>

const publishedResearchWhere = {
  _status: {
    equals: 'published' as const,
  },
}
const researchListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  date: true,
  image: true,
  notebook: true,
} as const
const researchDetailSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  date: true,
  image: true,
  notebook: true,
  content: true,
} as const
const researchSlugSelect = {
  slug: true,
} as const
const normalizeResearchSlug = (slug: string): string => slug.trim()

export const findResearchBySlug = async ({
  depth = 1,
  draft,
  payload,
  slug,
  user,
}: FindResearchBySlugArgs) => {
  const result = await payload.find({
    collection: 'research',
    depth,
    draft,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    ...(user ? { user } : {}),
    where: draft
      ? {
          slug: {
            equals: slug,
          },
        }
      : {
          and: [
            {
              slug: {
                equals: slug,
              },
            },
            {
              _status: {
                equals: 'published',
              },
            },
          ],
        },
  })

  return result.docs[0] || null
}

const getPublishedResearchBySlug = async (
  slug: string,
): Promise<PublishedResearchDetail | null> => {
  const payload = await getPayload({ config: configPromise })
  const normalizedSlug = normalizeResearchSlug(slug)
  const result = await payload.find({
    collection: 'research',
    depth: 1,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: researchDetailSelect,
    where: {
      and: [
        publishedResearchWhere,
        {
          slug: {
            equals: normalizedSlug,
          },
        },
      ],
    },
  })

  return (result.docs[0] as PublishedResearchDetail | undefined) || null
}

const getResearchList = async (): Promise<PublishedResearchSummary[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'research',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: researchListSelect,
    sort: '-date',
    where: publishedResearchWhere,
  })

  return result.docs as PublishedResearchSummary[]
}

const getResearchSlugs = async (): Promise<string[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'research',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: researchSlugSelect,
    sort: '-date',
    where: publishedResearchWhere,
  })

  return result.docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}

export const getCachedResearchList = () =>
  disableCache
    ? () => getResearchList()
    : unstable_cache(getResearchList, ['research-list'], {
        revalidate: 3600,
        tags: ['research_list'],
      })

export const getCachedResearchSlugs = () =>
  disableCache
    ? () => getResearchSlugs()
    : unstable_cache(getResearchSlugs, ['research-slugs'], {
        revalidate: 3600,
        tags: ['research_slugs', 'site-sitemap'],
      })

export const getCachedPublishedResearchBySlug = (slug: string) => {
  const normalizedSlug = normalizeResearchSlug(slug)

  return disableCache
    ? () => getPublishedResearchBySlug(normalizedSlug)
    : unstable_cache(
        () => getPublishedResearchBySlug(normalizedSlug),
        ['research-by-slug', normalizedSlug],
        {
          revalidate: 3600,
          tags: [`research_${normalizedSlug}`],
        },
      )
}
