import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { CardDocData } from '@/components/Card'
import type { Media } from '@/payload-types'
import { extractLegacyImageFromLexical } from '@/utilities/legacyImage'

const monthToIndex: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

const monthYearPattern =
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)[\s\-_]+(\d{4})\b/i

type NewsListDoc = {
  date?: string | null
  description?: string | null
  id: number
  image?: number | Media | null
  slug?: string | null
  title?: string | null
}

type NewsPreviewSource = {
  content?: unknown
  id: number
}

type NewsArchiveItem = CardDocData & {
  year: number | null
}

export type NewsArchiveDataset = {
  items: NewsArchiveItem[]
  years: number[]
}

const extractMonthYear = (item: { slug?: string | null; title?: string | null }) => {
  const fromTitle = item.title?.match(monthYearPattern)
  const fromSlug = item.slug?.replace(/-/g, ' ')?.match(monthYearPattern)
  const match = fromTitle || fromSlug

  if (!match) return null

  const month = monthToIndex[match[1]?.toLowerCase() || '']
  const year = Number(match[2])

  if (!Number.isFinite(month) || !Number.isFinite(year)) return null

  return {
    month,
    year,
  }
}

const getNewsSortTimestamp = (item: {
  date?: string | null
  slug?: string | null
  title?: string | null
}) => {
  const extracted = extractMonthYear(item)
  if (extracted) return Date.UTC(extracted.year, extracted.month, 1)

  if (item.date) {
    const parsed = Date.parse(item.date)
    if (Number.isFinite(parsed)) return parsed
  }

  return 0
}

const getNewsYear = (item: {
  date?: string | null
  slug?: string | null
  title?: string | null
}) => {
  const extracted = extractMonthYear(item)
  if (extracted) return extracted.year

  if (item.date) {
    const parsed = Date.parse(item.date)
    if (Number.isFinite(parsed)) return new Date(parsed).getUTCFullYear()
  }

  return null
}

const resolveMedia = (image: unknown, mediaByID: Map<number, Media>): Media | null => {
  if (image && typeof image === 'object') return image as Media
  if (typeof image === 'number') return mediaByID.get(image) || null
  return null
}

const toUniqueNumericIDs = (values: Array<number | null>) => {
  return Array.from(new Set(values.filter((value): value is number => typeof value === 'number')))
}

const isRenderableNewsDoc = (
  item: NewsListDoc,
): item is NewsListDoc & { slug: string; title: string } =>
  typeof item.slug === 'string' &&
  item.slug.trim().length > 0 &&
  typeof item.title === 'string' &&
  item.title.trim().length > 0

const getNewsArchiveDataset = async (): Promise<NewsArchiveDataset> => {
  const payload = await getPayload({ config: configPromise })

  const news = await payload.find({
    collection: 'news',
    depth: 0,
    overrideAccess: false,
    pagination: false,
    sort: '-date',
    where: {
      _status: {
        equals: 'published',
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      image: true,
      date: true,
    },
  })

  const preparedNews = (news.docs as NewsListDoc[])
    .filter(isRenderableNewsDoc)
    .map((item) => {
      const year = getNewsYear(item)
      return {
        ...item,
        sortTimestamp: getNewsSortTimestamp(item),
        year,
      }
    })
    .sort((a, b) => b.sortTimestamp - a.sortTimestamp)

  const years = Array.from(
    new Set(
      preparedNews
        .map((item) => item.year)
        .filter((year): year is number => typeof year === 'number'),
    ),
  ).sort((a, b) => b - a)

  const mediaIDs = toUniqueNumericIDs(
    preparedNews.map((item) => (typeof item.image === 'number' ? item.image : null)),
  )
  const previewSourceIDs = toUniqueNumericIDs(
    preparedNews.map((item) => (!item.image ? item.id : null)),
  )

  const [mediaResult, previewSourceResult] = await Promise.all([
    mediaIDs.length > 0
      ? payload.find({
          collection: 'media',
          depth: 0,
          limit: mediaIDs.length,
          overrideAccess: false,
          pagination: false,
          where: {
            id: {
              in: mediaIDs,
            },
          },
        })
      : Promise.resolve({ docs: [] as Media[] }),
    previewSourceIDs.length > 0
      ? payload.find({
          collection: 'news',
          depth: 0,
          limit: previewSourceIDs.length,
          overrideAccess: false,
          pagination: false,
          where: {
            id: {
              in: previewSourceIDs,
            },
          },
          select: {
            id: true,
            content: true,
          },
        })
      : Promise.resolve({ docs: [] as NewsPreviewSource[] }),
  ])

  const mediaByID = new Map<number, Media>()
  ;(mediaResult.docs as Media[]).forEach((mediaDoc) => {
    mediaByID.set(mediaDoc.id, mediaDoc)
  })

  const previewSourceByID = new Map<number, NewsPreviewSource>()
  ;(previewSourceResult.docs as NewsPreviewSource[]).forEach((sourceDoc) => {
    previewSourceByID.set(sourceDoc.id, sourceDoc)
  })

  const items: NewsArchiveItem[] = preparedNews.map((item) => {
    const resolvedImage = resolveMedia(item.image, mediaByID)
    const previewSource = previewSourceByID.get(item.id)

    return {
      date: item.date || undefined,
      meta: {
        description: item.description,
        image: resolvedImage,
      },
      previewImage: !resolvedImage ? extractLegacyImageFromLexical(previewSource?.content) : null,
      slug: item.slug,
      title: item.title,
      year: item.year,
    }
  })

  return {
    items,
    years,
  }
}

export const getCachedNewsArchiveDataset = () =>
  unstable_cache(getNewsArchiveDataset, ['news-archive-dataset'], {
    tags: ['news_list'],
  })
