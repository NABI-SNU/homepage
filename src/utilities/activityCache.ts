import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { CardDocData } from '@/components/Card'
import type { Activity } from '@/payload-types'
import type { ActivityType } from '@/utilities/activityURL'

const conferenceCardSelect = {
  title: true,
  slug: true,
  date: true,
  heroImage: true,
  meta: true,
  description: true,
} as const
const symposiumCardSelect = {
  title: true,
  slug: true,
  date: true,
  heroImage: true,
  meta: true,
  description: true,
} as const

type CachedActivity = Pick<
  Activity,
  | 'activityType'
  | 'content'
  | 'date'
  | 'description'
  | 'heroImage'
  | 'id'
  | 'location'
  | 'meta'
  | 'references'
  | 'relatedPosts'
  | 'relatedResearch'
  | 'slug'
  | 'title'
>

type GetCachedActivityArgs = {
  activityType: ActivityType
  depth?: number
  slug: string
}

const getConferenceYearBounds = (year: number): { endISO: string; startISO: string } => {
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0))

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  }
}

const getConferenceYearFromDate = (date: string | null | undefined): number | null => {
  if (!date) return null
  const timestamp = Date.parse(date)
  if (!Number.isFinite(timestamp)) return null
  return new Date(timestamp).getUTCFullYear()
}

const mapConferenceToCard = (
  item: Pick<Activity, 'date' | 'description' | 'heroImage' | 'meta' | 'slug' | 'title'>,
): CardDocData => {
  const heroImage = item.heroImage && typeof item.heroImage === 'object' ? item.heroImage : null
  const metaImage = item.meta?.image && typeof item.meta.image === 'object' ? item.meta.image : null

  return {
    slug: item.slug,
    title: item.title,
    date: item.date,
    relationTo: 'conferences',
    meta: {
      ...(item.meta || {}),
      description: item.meta?.description || item.description,
      image: metaImage || heroImage,
    },
  }
}

const getActivityBySlugAndType = async ({
  activityType,
  depth = 0,
  slug,
}: GetCachedActivityArgs): Promise<CachedActivity | null> => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'activities',
    depth,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          slug: {
            equals: slug,
          },
        },
        {
          activityType: {
            equals: activityType,
          },
        },
      ],
    },
    select: {
      title: true,
      slug: true,
      activityType: true,
      description: true,
      date: true,
      location: true,
      heroImage: true,
      content: true,
      references: true,
      meta: true,
      relatedPosts: true,
      relatedResearch: true,
    },
  })

  return result.docs[0] || null
}

const getActivitySlugsByType = async (activityType: ActivityType): Promise<string[]> => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'activities',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          activityType: {
            equals: activityType,
          },
        },
      ],
    },
    select: {
      slug: true,
    },
  })

  return result.docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}

const getConferenceYears = async (): Promise<number[]> => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'activities',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    sort: '-date',
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          activityType: {
            equals: 'conference',
          },
        },
      ],
    },
    select: {
      date: true,
    },
  })

  return Array.from(
    new Set(
      result.docs
        .map((doc) => getConferenceYearFromDate(doc.date))
        .filter((year): year is number => typeof year === 'number'),
    ),
  ).sort((a, b) => b - a)
}

const getConferenceCardsByYear = async (year: number): Promise<CardDocData[]> => {
  const payload = await getPayload({ config: configPromise })
  const { endISO, startISO } = getConferenceYearBounds(year)

  const result = await payload.find({
    collection: 'activities',
    depth: 1,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    sort: '-date',
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          activityType: {
            equals: 'conference',
          },
        },
        {
          date: {
            greater_than_equal: startISO,
          },
        },
        {
          date: {
            less_than: endISO,
          },
        },
      ],
    },
    select: conferenceCardSelect,
  })

  return result.docs.map((doc) => mapConferenceToCard(doc))
}

const getSymposiumCards = async (): Promise<CardDocData[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'activities',
    depth: 1,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    select: symposiumCardSelect,
    sort: '-date',
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          activityType: {
            equals: 'symposium',
          },
        },
      ],
    },
  })

  return result.docs.map((item) => {
    const heroImage = item.heroImage && typeof item.heroImage === 'object' ? item.heroImage : null
    const metaImage =
      item.meta?.image && typeof item.meta.image === 'object' ? item.meta.image : null

    return {
      date: item.date,
      meta: {
        ...(item.meta || {}),
        description: item.meta?.description || item.description,
        image: metaImage || heroImage,
      },
      relationTo: 'symposium' as const,
      slug: item.slug,
      title: item.title,
    }
  })
}

export const getCachedActivityBySlugAndType = ({
  activityType,
  depth = 0,
  slug,
}: GetCachedActivityArgs) =>
  unstable_cache(
    () => getActivityBySlugAndType({ activityType, depth, slug }),
    ['activity-by-slug-and-type', activityType, slug, String(depth)],
    {
      revalidate: 3600,
      tags: [`activities_${activityType}_slug_${slug}`],
    },
  )

export const getCachedActivitySlugsByType = (activityType: ActivityType) =>
  unstable_cache(
    () => getActivitySlugsByType(activityType),
    ['activity-slugs-by-type', activityType],
    {
      revalidate: 3600,
      tags: [`activities_${activityType}_slugs`],
    },
  )

export const getCachedConferenceYears = () =>
  unstable_cache(() => getConferenceYears(), ['conference-years'], {
    revalidate: 3600,
    tags: ['activities_conference_years'],
  })

export const getCachedConferenceCardsByYear = (year: number) =>
  unstable_cache(() => getConferenceCardsByYear(year), ['conference-cards-by-year', String(year)], {
    revalidate: 3600,
    tags: ['activities_conference_years', `activities_conference_year_${year}`],
  })

export const getCachedSymposiumCards = () =>
  unstable_cache(getSymposiumCards, ['symposium-cards'], {
    revalidate: 3600,
    tags: ['symposium_list'],
  })
