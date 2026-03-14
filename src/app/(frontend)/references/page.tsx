import type { Metadata } from 'next'

import { ReferenceSearch } from '@/components/references/ReferenceSearch'
import { getCachedAllReferences } from '@/utilities/references'

export const revalidate = 600

export default async function ReferencesPage() {
  const references = await getCachedAllReferences()()

  return (
    <main className="page-shell">
      <section className="page-header container text-center">
        <p className="page-eyebrow">Bibliography</p>
        <h1 className="page-title-lg">Archive of NeuroAI Papers</h1>
      </section>

      <section className="container section-gap relative pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
        </div>

        <div className="relative">
          <ReferenceSearch references={references} />
        </div>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Papers',
  description:
    'Archive of papers referenced in NABI posts, news, research notes, and announcements.',
}
