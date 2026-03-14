import type { Metadata } from 'next'

import { WikiSelfServiceActions } from '@/components/wiki/WikiSelfServiceActions.client'
import { WikiIndex } from '@/components/wiki/WikiIndex.client'
import { getCachedWikiIndexData } from '@/utilities/wiki'

export const revalidate = 1800

export default async function WikiIndexPage() {
  const { allItems, contributors, featured, recent } = await getCachedWikiIndexData()()

  return (
    <main className="page-shell-wide">
      <section className="container page-header text-center">
        <p className="page-eyebrow">Wiki</p>
        <h1 className="page-title-lg text-balance">Connected concepts</h1>
        <p className="page-subtitle mx-auto max-w-2xl">
          Explore the network graph of NeuroAI concepts, from foundational neuroscience to
          cutting-edge AI.
        </p>
        <WikiSelfServiceActions className="mt-6 justify-center" />
      </section>

      <WikiIndex
        allItems={allItems}
        contributors={contributors}
        featured={featured}
        recent={recent}
      />
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Wiki',
  description: 'Explore interconnected wiki pages with backlinks and graph navigation.',
}
