import type { Metadata } from 'next'

import React from 'react'

import { ProgramArchive } from '@/components/Program/ProgramArchive'
import { getCachedProgramActivities } from '@/utilities/activityCache'

export const revalidate = 3600

export default async function SeminarsPage() {
  const activities = await getCachedProgramActivities()()

  return <ProgramArchive activities={activities} />
}

export const metadata: Metadata = {
  title: 'Seminars & Topic Reviews',
  description:
    'The NABI study program: Foundations Seminar sessions with recordings and book chapters, and the Topic Review Series of paper reviews.',
}
