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
  title: 'Seminars',
  description:
    'The NABI Foundations Seminar: session recordings and the NABI book chapters for each session.',
}
