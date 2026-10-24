import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import React from 'react'

import { ConferencesArchive } from '@/components/ConferencesArchive'
import { getCachedConferenceCardsByYear, getCachedConferenceYears } from '@/utilities/activityCache'

export const revalidate = 3600

type Args = {
  params: Promise<{
    year: string
  }>
}

export async function generateStaticParams() {
  try {
    const years = await getCachedConferenceYears()()
    return years.map((year) => ({ year: String(year) }))
  } catch {
    return []
  }
}

export default async function ConferencesYearPage({ params: paramsPromise }: Args) {
  const { year } = await paramsPromise
  const years = await getCachedConferenceYears()()
  const activeYear = Number(year)

  if (!years.includes(activeYear)) notFound()

  const conferences = await getCachedConferenceCardsByYear(activeYear)()

  return <ConferencesArchive activeYear={activeYear} conferences={conferences} years={years} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { year } = await paramsPromise

  return {
    title: `Conferences ${year}`,
    description: `Posters, presentations, and updates from NABI conferences in ${year}.`,
  }
}
