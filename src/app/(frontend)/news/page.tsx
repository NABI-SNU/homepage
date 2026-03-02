import type { Metadata } from 'next'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { Media } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'
import { extractLegacyImageFromLexical } from '@/utilities/legacyImage'

export const revalidate = 600

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

type Args = {
  searchParams?: Promise<{
    year?: string
  }>
}

export default async function NewsPage({ searchParams: searchParamsPromise }: Args) {
  const searchParams = searchParamsPromise ? await searchParamsPromise : {}
  const payload = await getPayload({ config: configPromise })

  const news = await payload.find({
    collection: 'news',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: '-date',
    where: {
      _status: {
        equals: 'published',
      },
    },
    select: {
      title: true,
      slug: true,
      description: true,
      image: true,
      date: true,
      content: true,
    },
  })

  const sortedNews = [...news.docs].sort((a, b) => {
    return getNewsSortTimestamp(b) - getNewsSortTimestamp(a)
  })

  const years = Array.from(
    new Set(
      sortedNews
        .map((item) => getNewsYear(item))
        .filter((year): year is number => typeof year === 'number'),
    ),
  ).sort((a, b) => b - a)

  const requestedYear = searchParams?.year ? Number(searchParams.year) : null
  const activeYear =
    requestedYear && years.includes(requestedYear) ? requestedYear : years[0] || null

  const filteredNews = activeYear
    ? sortedNews.filter((item) => {
        return getNewsYear(item) === activeYear
      })
    : sortedNews

  const mediaIDs = Array.from(
    new Set(
      filteredNews
        .map((item) => (typeof item.image === 'number' ? item.image : null))
        .filter((id): id is number => typeof id === 'number'),
    ),
  )

  const mediaByID = new Map<number, Media>()

  if (mediaIDs.length > 0) {
    const media = await payload.find({
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

    media.docs.forEach((mediaDoc) => {
      mediaByID.set(mediaDoc.id, mediaDoc)
    })
  }

  const mappedNews = filteredNews.map((item) => {
    const legacyImage = extractLegacyImageFromLexical(item.content)
    const resolvedImage =
      typeof item.image === 'object' && item.image
        ? item.image
        : typeof item.image === 'number'
          ? mediaByID.get(item.image) || null
          : null

    return {
      slug: item.slug,
      title: item.title,
      date: item.date,
      previewImage: !resolvedImage ? legacyImage : null,
      meta: {
        description: item.description,
        image: resolvedImage,
      },
    }
  })

  return (
    <div className="page-shell-wide">
      <div className="page-header container mb-12 text-center">
        <p className="page-eyebrow">Resources</p>
        <h1 className="page-title">News</h1>
        <p className="page-subtitle mx-auto max-w-2xl">
          Monthly highlights featuring curated research papers and resources in computational
          neuroscience and AI.
        </p>
      </div>

      {years.length > 0 && (
        <div className="container mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Year</span>
            <div className="inline-flex overflow-hidden rounded-full border border-border">
              {years.map((year) => {
                const isActive = year === activeYear

                return (
                  <Link
                    key={year}
                    href={`/news?year=${year}`}
                    className={[
                      'px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    ].join(' ')}
                  >
                    {year}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <CollectionArchive posts={mappedNews} relationTo="news" showCategories={false} showDate />
    </div>
  )
}

export const metadata: Metadata = {
  title: 'News',
  description:
    'Monthly highlights featuring curated research papers and resources in computational neuroscience and AI.',
}
