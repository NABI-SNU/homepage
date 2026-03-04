import type { Metadata } from 'next'

import { CollectionArchive } from '@/components/CollectionArchive'
import { getCachedNewsArchiveDataset } from '@/utilities/getNews'
import Link from 'next/link'
import React from 'react'

export const revalidate = 600

type Args = {
  searchParams?: Promise<{
    year?: string
  }>
}

export default async function NewsPage({ searchParams: searchParamsPromise }: Args) {
  const searchParams = searchParamsPromise ? await searchParamsPromise : {}
  const archive = await getCachedNewsArchiveDataset()()
  const { years } = archive

  const requestedYear = searchParams?.year ? Number(searchParams.year) : null
  const activeYear =
    requestedYear && years.includes(requestedYear) ? requestedYear : years[0] || null

  const mappedNews = activeYear
    ? archive.items.filter((item) => item.year === activeYear)
    : archive.items

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
