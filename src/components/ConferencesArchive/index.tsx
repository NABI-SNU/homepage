import Link from 'next/link'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import type { CardDocData } from '@/components/Card'

export const conferencesYearHref = (year: number, latestYear: number | null): string =>
  year === latestYear ? '/conferences' : `/conferences/year/${year}`

export const ConferencesArchive: React.FC<{
  activeYear: number
  conferences: CardDocData[]
  years: number[]
}> = ({ activeYear, conferences, years }) => {
  const latestYear = years[0] ?? null

  return (
    <div className="page-shell-wide">
      <div className="page-header container mb-12 text-center">
        <p className="page-eyebrow">Activities</p>
        <h1 className="page-title">Conferences</h1>
        <p className="page-subtitle mx-auto max-w-2xl">
          Conferences Attended — posters, presentations, and member updates.
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
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    ].join(' ')}
                    href={conferencesYearHref(year, latestYear)}
                  >
                    {year}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <CollectionArchive
        cardImageAspect="portrait"
        posts={conferences}
        relationTo="conferences"
        showCategories={false}
        showDate
      />

      {conferences.length === 0 && (
        <p className="container mt-6 text-sm text-muted-foreground">
          No conferences found for {activeYear}.
        </p>
      )}
    </div>
  )
}
