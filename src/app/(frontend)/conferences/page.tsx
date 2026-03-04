import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import {
  getCachedConferenceCardsByYear,
  getCachedConferenceYears,
} from '@/utilities/activityCache'

export const revalidate = 600

type Args = {
  searchParams: Promise<{
    year?: string
  }>
}

const parseYear = (value: string | undefined): number | null => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

export default async function ConferencesPage({ searchParams: searchParamsPromise }: Args) {
  const { year: yearParam } = await searchParamsPromise
  const years = await getCachedConferenceYears()()
  const fallbackYear = years[0] || new Date().getUTCFullYear()
  const requestedYear = parseYear(yearParam)
  const activeYear =
    requestedYear && years.includes(requestedYear) ? requestedYear : fallbackYear
  const conferences =
    years.length > 0 ? await getCachedConferenceCardsByYear(activeYear)() : []

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
                const href = `/conferences?year=${year}`

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
                    href={href}
                    prefetch={false}
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

export const metadata: Metadata = {
  title: 'Conferences',
  description: 'Posters, presentations, and updates from NABI conferences.',
}
