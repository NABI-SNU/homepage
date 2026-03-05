import type { Metadata } from 'next'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import { notFound } from 'next/navigation'

import { TableOfContents } from '@/components/TableOfContents'
import { WikiLinkifiedRichText } from '@/components/wiki/WikiLinkifiedRichText'
import { WikiPageSidebar } from '@/components/wiki/WikiPageSidebar'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedWikiBySlug, getCachedWikiList, buildWikiHrefLookup } from '@/utilities/wiki'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 900

export default async function WikiDetailPage({ params }: Args) {
  const { slug } = await params
  const [entry, wikiDocs] = await Promise.all([getCachedWikiBySlug(slug)(), getCachedWikiList()()])
  if (!entry) notFound()

  const wikiLinkMap = buildWikiHrefLookup(wikiDocs)
  const wikiByID = new Map(wikiDocs.map((doc) => [String(doc.id), doc]))
  const currentWiki = wikiDocs.find((doc) => doc.slug === slug) || null

  const outgoing = currentWiki
    ? (currentWiki.outgoingLinks || [])
        .map((ref) => {
          const id =
            typeof ref === 'number' || typeof ref === 'string'
              ? ref
              : ref && typeof ref === 'object' && 'id' in ref
                ? ref.id
                : null
          if (id === null) return null
          return wikiByID.get(String(id)) || null
        })
        .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
    : []

  const backlinks = currentWiki
    ? wikiDocs.filter((doc) => {
        if (doc.slug === slug) return false
        return (doc.outgoingLinks || []).some((ref) => {
          const id =
            typeof ref === 'number' || typeof ref === 'string'
              ? ref
              : ref && typeof ref === 'object' && 'id' in ref
                ? ref.id
                : null
          return id !== null && String(id) === String(currentWiki.id)
        })
      })
    : []

  const unresolvedTargets = (entry.unresolvedWikiLinks || [])
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'target' in item) return item.target || ''
      return ''
    })
    .filter(Boolean)

  const localNodeIDs = new Set<string>([entry.slug])
  const allLinks: Array<{ source: string; target: string }> = []
  wikiDocs.forEach((doc) => {
    ;(doc.outgoingLinks || []).forEach((ref) => {
      const id =
        typeof ref === 'number' || typeof ref === 'string'
          ? ref
          : ref && typeof ref === 'object' && 'id' in ref
            ? ref.id
            : null
      if (id === null) return
      const target = wikiByID.get(String(id))
      if (!target || target.slug === doc.slug) return
      const edge = { source: doc.slug, target: target.slug }
      allLinks.push(edge)
      if (edge.source === entry.slug || edge.target === entry.slug) {
        localNodeIDs.add(edge.source)
        localNodeIDs.add(edge.target)
      }
    })
  })

  const localGraphData = {
    links: allLinks.filter(
      (link) => localNodeIDs.has(link.source) && localNodeIDs.has(link.target),
    ),
    nodes: wikiDocs
      .filter((doc) => localNodeIDs.has(doc.slug))
      .map((doc) => ({ id: doc.slug, title: doc.title })),
  }

  return (
    <article className="page-shell">
      <header className="container max-w-5xl">
        <p className="page-eyebrow">Wiki</p>
        <h1 className="page-title-lg">{entry.title}</h1>
        {entry.summary && (
          <p className="page-subtitle">{entry.summary}</p>
        )}
      </header>
      <TableOfContents />

      <section className="container mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div data-post-content>
          <WikiLinkifiedRichText
            data={entry.content as DefaultTypedEditorState}
            wikiLinkMap={wikiLinkMap}
          />
        </div>
        <WikiPageSidebar
          backlinks={backlinks}
          currentSlug={entry.slug}
          graphData={localGraphData}
          outgoing={outgoing}
          unresolvedTargets={unresolvedTargets}
        />
      </section>
    </article>
  )
}

export async function generateStaticParams() {
  const wikiDocs = await getCachedWikiList()()
  return wikiDocs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const entry = await getCachedWikiBySlug(slug)()

  return generateMeta({
    description: entry?.summary || 'Wiki page',
    doc: entry
      ? {
          description: entry.summary || undefined,
          slug: ['wiki', slug],
          title: entry.title || slug,
        }
      : null,
    path: `/wiki/${slug}`,
    title: entry?.title || 'Wiki',
  })
}
