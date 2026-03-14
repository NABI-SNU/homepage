import type { Metadata } from 'next'

import { WikiGraph } from '@/components/wiki/WikiGraph'
import { getCachedWikiGraph } from '@/utilities/wiki'

export const revalidate = 1800

export default async function WikiGraphPage() {
  const graphData = await getCachedWikiGraph()()

  return (
    <main className="page-shell">
      <section className="container page-header text-center">
        <p className="page-eyebrow">Knowledge Graph</p>
        <h1 className="page-title-lg">Global wiki graph</h1>
        <p className="page-subtitle mx-auto">
          Zoom, pan, and open nodes to navigate the knowledge network.
        </p>
      </section>

      <section className="container section-gap pb-14">
        <WikiGraph height={620} links={graphData.links} nodes={graphData.nodes} />
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Wiki Graph',
  description: 'Interactive graph explorer for wiki pages and their connections.',
}
