import type { Metadata } from 'next'

import React from 'react'

import { ConferencesArchive } from '@/components/ConferencesArchive'
import { getCachedConferenceCardsByYear, getCachedConferenceYears } from '@/utilities/activityCache'

export const revalidate = 3600

export default async function ConferencesPage() {
  const years = await getCachedConferenceYears()()
  const activeYear = years[0] || new Date().getUTCFullYear()
  const conferences = years.length > 0 ? await getCachedConferenceCardsByYear(activeYear)() : []

  return <ConferencesArchive activeYear={activeYear} conferences={conferences} years={years} />
}

export const metadata: Metadata = {
  title: 'Conferences',
  description: 'Posters, presentations, and updates from NABI conferences.',
}
