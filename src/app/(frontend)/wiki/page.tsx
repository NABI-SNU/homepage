import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { WikiSelfServiceActions } from '@/components/wiki/WikiSelfServiceActions.client'
import { WikiIndex } from '@/components/wiki/WikiIndex.client'
import { getCachedTagLookup, getCachedWikiList } from '@/utilities/wiki'

export const revalidate = 900

type ContributorInfo = {
  name: string
  email: string | null
  slug: string | null
  avatar: string | null
  wikiCount: number
}

export default async function WikiIndexPage() {
  const [wikiDocs, tags] = await Promise.all([getCachedWikiList()(), getCachedTagLookup()()])
  const tagByID = new Map(tags.map((tag) => [tag.id, tag]))

  // Fetch wiki docs with createdBy populated for contributors
  const payload = await getPayload({ config: configPromise })
  const wikiWithAuthors = await payload.find({
    collection: 'wiki',
    depth: 1,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    select: {
      createdBy: true,
      slug: true,
      updatedAt: true,
    },
    where: {
      _status: { equals: 'published' },
    },
    sort: '-updatedAt',
  })

  // Build contributor map from createdBy
  const contributorMap = new Map<number, ContributorInfo>()
  for (const doc of wikiWithAuthors.docs) {
    const user = doc.createdBy
    if (!user || typeof user !== 'object' || !('id' in user)) continue
    const userId = user.id as number
    const existing = contributorMap.get(userId)
    if (existing) {
      existing.wikiCount++
    } else {
      // Try to find the linked person for this user
      let personSlug: string | null = null
      let avatarUrl: string | null = null
      try {
        const personResult = await payload.find({
          collection: 'people',
          depth: 1,
          limit: 1,
          overrideAccess: false,
          pagination: false,
          where: { user: { equals: userId } },
          select: { slug: true, avatar: true, name: true, email: true },
        })
        const person = personResult.docs[0]
        if (person) {
          personSlug = person.slug || null
          const avatar = person.avatar
          if (avatar && typeof avatar === 'object' && 'url' in avatar) {
            avatarUrl = (avatar as { url?: string }).url || null
          }
        }
      } catch {
        // ignore
      }
      contributorMap.set(userId, {
        name: (user as { name?: string }).name || (user as { email?: string }).email || 'Anonymous',
        email: (user as { email?: string }).email || null,
        slug: personSlug,
        avatar: avatarUrl,
        wikiCount: 1,
      })
    }
  }

  const contributors = Array.from(contributorMap.values())
    .sort((a, b) => b.wikiCount - a.wikiCount)
    .slice(0, 8)

  // Count incoming links to each wiki page for "featured" ranking
  const incomingLinkCount = new Map<string, number>()
  wikiDocs.forEach((doc) => {
    ;(doc.outgoingLinks || []).forEach((ref) => {
      const targetId =
        typeof ref === 'number' || typeof ref === 'string'
          ? String(ref)
          : ref && typeof ref === 'object' && 'id' in ref
            ? String(ref.id)
            : null
      if (targetId) {
        incomingLinkCount.set(targetId, (incomingLinkCount.get(targetId) || 0) + 1)
      }
    })
  })

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
    incomingLinks: incomingLinkCount.get(String(doc.id)) || 0,
  }))

  // Featured: top articles by incoming link count
  const featured = [...searchItems].sort((a, b) => b.incomingLinks - a.incomingLinks).slice(0, 6)

  // Recent: sorted by update date
  const recent = [...searchItems]
    .sort((a, b) => {
      const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return bDate - aDate
    })
    .slice(0, 6)

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
        allItems={searchItems}
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
