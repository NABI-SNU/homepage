import type { Metadata } from 'next'

import { PeopleDirectory } from '@/components/people/PeopleDirectory.client'
import { Suspense } from 'react'
import { getCachedPeopleList } from '@/utilities/getPeople'

export const revalidate = 3600

export default async function PeoplePage() {
  const people = await getCachedPeopleList()()

  return (
    <main className="page-shell">
      <section className="page-header container text-center">
        <p className="page-eyebrow">People</p>
        <h1 className="page-title-lg">Meet our Members</h1>
      </section>
      <Suspense fallback={<PeopleDirectoryFallback />}>
        <PeopleDirectory people={people} />
      </Suspense>
    </main>
  )
}

function PeopleDirectoryFallback() {
  return (
    <section className="container mt-10">
      <p className="text-sm text-muted-foreground">Loading directory...</p>
    </section>
  )
}

export const metadata: Metadata = {
  title: 'People',
  description: 'Meet the members and collaborators of the NABI Labs.',
}
