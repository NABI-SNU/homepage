import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { PeopleDirectory } from '@/components/people/PeopleDirectory.client'
import { Suspense } from 'react'

export const revalidate = 600

export default async function PeoplePage() {
  const payload = await getPayload({ config: configPromise })

  const people = await payload.find({
    collection: 'people',
    depth: 1,
    limit: 1000,
    pagination: false,
    overrideAccess: false,
    sort: 'name',
    select: {
      name: true,
      slug: true,
      email: true,
      research: true,
      roleAssignments: true,
      socials: true,
      years: true,
      avatar: true,
    },
  })

  return (
    <main className="page-shell">
      <section className="page-header container text-center">
        <p className="page-eyebrow">People</p>
        <h1 className="page-title-lg">Meet our Members</h1>
      </section>
      <Suspense fallback={<PeopleDirectoryFallback />}>
        <PeopleDirectory people={people.docs} />
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
