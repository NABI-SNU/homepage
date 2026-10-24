import Link from 'next/link'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { NewsArchiveDataset } from '@/utilities/getNews'

export const newsYearHref = (year: number, latestYear: number | null): string =>
  year === latestYear ? '/news' : `/news/year/${year}`

export const NewsArchive: React.FC<{
  activeYear: number | null
  archive: NewsArchiveDataset
}> = ({ activeYear, archive }) => {
  const { years } = archive
  const latestYear = years[0] ?? null
  const items = activeYear
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
              {years.map((year) => (
                <Link
                  key={year}
                  href={newsYearHref(year, latestYear)}
                  className={[
                    'px-4 py-2 text-sm font-medium transition-colors',
                    year === activeYear
                      ? 'bg-muted text-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  ].join(' ')}
                >
                  {year}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <CollectionArchive posts={items} relationTo="news" showCategories={false} showDate />
    </div>
  )
}
