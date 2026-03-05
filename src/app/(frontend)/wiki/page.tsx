import type { Metadata } from 'next'

import { WikiSearch } from '@/components/wiki/WikiSearch.client'
import { getCachedTagLookup, getCachedWikiList } from '@/utilities/wiki'

export const revalidate = 900

export default async function WikiIndexPage() {
  const [wikiDocs, tags] = await Promise.all([getCachedWikiList()(), getCachedTagLookup()()])
  const tagByID = new Map(tags.map((tag) => [tag.id, tag]))

  const searchItems = wikiDocs.map((doc) => ({
    slug: doc.slug,
    summary: doc.summary,
    tags: (doc.tags || [])
      .map((tag) => {
        if (!tag) return null
        if (typeof tag === 'object') {
          return {
            slug: tag.slug || String(tag.id),
            title: tag.title || 'tag',
          }
        }

        const resolved = tagByID.get(tag)
        if (!resolved) return null

        return {
          slug: resolved.slug || String(resolved.id),
          title: resolved.title || 'tag',
        }
      })
      .filter((tag): tag is { slug: string; title: string } => Boolean(tag)),
    title: doc.title,
    updatedAt: (doc as { updatedAt?: string }).updatedAt,
  }))

  return (
    <main className="page-shell">
      <section className="container page-header text-center">
        <p className="page-eyebrow">Wiki</p>
        <h1 className="page-title-lg">Connected concepts</h1>
        <p className="page-subtitle mx-auto">Explore the network graph of NeuroAI concepts.</p>
      </section>

      <section className="container section-gap pb-12">
        <WikiSearch items={searchItems} />
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Wiki',
  description: 'Explore interconnected wiki pages with backlinks and graph navigation.',
}
