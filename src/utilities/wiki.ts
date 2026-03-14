import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { buildWikiLookup, normalizeWikiLookupKey } from '@/utilities/wikiLinks'

type WikiID = number | string

type TagLookupDoc = {
  id: number
  slug?: string | null
  title?: string | null
}

export type WikiLookupDoc = {
  aliases?: string[] | null
  id: WikiID
  slug?: string | null
  title?: string | null
}

export type WikiSummary = {
  aliases?: string[] | null
  id: WikiID
  outgoingLinks?: Array<WikiID | { id: WikiID }> | null
  slug: string
  summary?: string | null
  tags?: Array<number | { id: number; slug?: string | null; title?: string | null }>
  title: string
  unresolvedWikiLinks?: Array<{ target?: string | null } | string>
  updatedAt?: string
}

export type WikiGraphData = {
  links: Array<{ source: string; target: string }>
  nodes: Array<{ id: string; title: string }>
}

export type WikiContributorInfo = {
  avatar: string | null
  email: string | null
  name: string
  slug: string | null
  wikiCount: number
}

export type WikiIndexItem = {
  incomingLinks: number
  slug: string
  summary?: string | null
  tags: Array<{ slug: string; title: string }>
  title: string
  updatedAt?: string
}

export type WikiIndexData = {
  allItems: WikiIndexItem[]
  contributors: WikiContributorInfo[]
  featured: WikiIndexItem[]
  recent: WikiIndexItem[]
}

const publishedWhere = {
  _status: {
    equals: 'published' as const,
  },
}

const toWikiID = (value: unknown): WikiID | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }

  return null
}

export const normalizeWikiDoc = (doc: Partial<WikiSummary>): WikiSummary | null => {
  if (!doc.slug || !doc.title || !doc.id) return null

  return {
    aliases: doc.aliases || [],
    id: doc.id,
    outgoingLinks: doc.outgoingLinks || [],
    slug: doc.slug,
    summary: doc.summary || null,
    tags: doc.tags || [],
    title: doc.title,
    unresolvedWikiLinks: doc.unresolvedWikiLinks || [],
    updatedAt: doc.updatedAt,
  }
}

const findAllPublishedWiki = async (): Promise<WikiSummary[]> => {
  const payload = await getPayload({ config: configPromise })
  const results = await payload.find({
    collection: 'wiki',
    depth: 0,
    limit: 2000,
    overrideAccess: false,
    pagination: false,
    select: {
      aliases: true,
      id: true,
      outgoingLinks: true,
      slug: true,
      summary: true,
      tags: true,
      title: true,
      unresolvedWikiLinks: true,
      updatedAt: true,
    },
    where: publishedWhere,
  })

  return (results.docs as Partial<WikiSummary>[])
    .map((doc) => normalizeWikiDoc(doc))
    .filter((doc): doc is WikiSummary => Boolean(doc))
}

const findAllWikiLookupDocs = async (): Promise<WikiLookupDoc[]> => {
  const payload = await getPayload({ config: configPromise })
  const results = await payload.find({
    collection: 'wiki',
    depth: 0,
    limit: 2000,
    overrideAccess: false,
    pagination: false,
    select: {
      aliases: true,
      id: true,
      slug: true,
      title: true,
    },
    where: publishedWhere,
  })

  return results.docs as WikiLookupDoc[]
}

const findAllTags = async (): Promise<TagLookupDoc[]> => {
  const payload = await getPayload({ config: configPromise })
  const results = await payload.find({
    collection: 'tags',
    depth: 0,
    limit: 2000,
    overrideAccess: false,
    pagination: false,
    select: {
      id: true,
      slug: true,
      title: true,
    },
  })

  return results.docs as TagLookupDoc[]
}

const findPublishedWikiBySlug = async (
  slug: string,
): Promise<
  | (WikiSummary & {
      content?: unknown
    })
  | null
> => {
  const payload = await getPayload({ config: configPromise })
  const results = await payload.find({
    collection: 'wiki',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: {
      aliases: true,
      content: true,
      id: true,
      outgoingLinks: true,
      slug: true,
      summary: true,
      tags: true,
      title: true,
      unresolvedWikiLinks: true,
      updatedAt: true,
    },
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        publishedWhere,
      ],
    },
  })

  const doc = results.docs[0] as
    | (Partial<WikiSummary> & {
        content?: unknown
      })
    | undefined
  if (!doc) return null
  const normalized = normalizeWikiDoc(doc)
  if (!normalized) return null

  return {
    ...normalized,
    content: doc.content,
  }
}

export const getCachedWikiList = () =>
  unstable_cache(findAllPublishedWiki, ['wiki-list-v2'], {
    revalidate: 1800,
    tags: ['wiki_list'],
  })

export const getCachedWikiLookupDocs = () =>
  unstable_cache(findAllWikiLookupDocs, ['wiki-lookup-v1'], {
    revalidate: 1800,
    tags: ['wiki_list'],
  })

export const getCachedTagLookup = () =>
  unstable_cache(findAllTags, ['tag-lookup-v1'], {
    revalidate: 1800,
    tags: ['wiki_list'],
  })

export const getCachedWikiBySlug = (slug: string) =>
  unstable_cache(() => findPublishedWikiBySlug(slug), ['wiki-doc-v2', slug], {
    revalidate: 1800,
    tags: ['wiki_list', `wiki_${slug}`],
  })

const buildGraphData = async (): Promise<WikiGraphData> => {
  const docs = await getCachedWikiList()()
  const idToSlug = new Map<string, string>()
  const nodes = docs.map((doc) => {
    idToSlug.set(String(doc.id), doc.slug)
    return { id: doc.slug, title: doc.title }
  })

  const links: WikiGraphData['links'] = []

  docs.forEach((doc) => {
    ;(doc.outgoingLinks || []).forEach((targetRef) => {
      const targetID = toWikiID(targetRef)
      if (targetID === null) return
      const source = doc.slug
      const target = idToSlug.get(String(targetID))
      if (!source || !target || source === target) return
      links.push({ source, target })
    })
  })

  const dedup = new Set<string>()
  const uniqueLinks = links.filter((link) => {
    const key = `${link.source}->${link.target}`
    if (dedup.has(key)) return false
    dedup.add(key)
    return true
  })

  return { links: uniqueLinks, nodes }
}

export const getCachedWikiGraph = () =>
  unstable_cache(buildGraphData, ['wiki-graph-v2'], {
    revalidate: 1800,
    tags: ['wiki_graph', 'wiki_list'],
  })

export const getCachedWikiBacklinks = (slug: string) =>
  unstable_cache(
    async (): Promise<WikiSummary[]> => {
      const docs = await getCachedWikiList()()
      const current = docs.find((doc) => doc.slug === slug)
      if (!current) return []

      return docs.filter((doc) => {
        if (doc.slug === slug) return false

        return (doc.outgoingLinks || []).some((targetRef) => {
          const targetID = toWikiID(targetRef)
          return targetID !== null && String(targetID) === String(current.id)
        })
      })
    },
    ['wiki-backlinks-v2', slug],
    {
      revalidate: 1800,
      tags: ['wiki_list', `wiki_${slug}`],
    },
  )

export const getCachedWikiOutgoing = (slug: string) =>
  unstable_cache(
    async (): Promise<WikiSummary[]> => {
      const docs = await getCachedWikiList()()
      const byID = new Map(docs.map((doc) => [String(doc.id), doc]))
      const current = docs.find((doc) => doc.slug === slug)
      if (!current) return []

      const results: WikiSummary[] = []
      const seen = new Set<string>()

      ;(current.outgoingLinks || []).forEach((targetRef) => {
        const targetID = toWikiID(targetRef)
        if (targetID === null) return
        const key = String(targetID)
        if (seen.has(key)) return
        seen.add(key)

        const targetDoc = byID.get(key)
        if (targetDoc) results.push(targetDoc)
      })

      return results
    },
    ['wiki-outgoing-v1', slug],
    {
      revalidate: 1800,
      tags: ['wiki_list', `wiki_${slug}`],
    },
  )

export const buildWikiHrefLookup = (docs: WikiLookupDoc[]): Record<string, string> => {
  const lookup = buildWikiLookup(docs)
  const map: Record<string, string> = {}

  lookup.keyToID.forEach((id, key) => {
    const slug = lookup.idToSlug.get(id)
    if (!slug) return
    map[key] = slug
  })

  docs.forEach((doc) => {
    if (!doc.slug) return
    const normalizedSlug = normalizeWikiLookupKey(doc.slug)
    if (normalizedSlug) map[normalizedSlug] = doc.slug
  })

  return map
}

const getWikiIndexData = async (): Promise<WikiIndexData> => {
  const payload = await getPayload({ config: configPromise })
  const [wikiDocs, tags, wikiWithAuthors] = await Promise.all([
    findAllPublishedWiki(),
    findAllTags(),
    payload.find({
      collection: 'wiki',
      depth: 1,
      limit: 200,
      overrideAccess: false,
      pagination: false,
      select: {
        createdBy: true,
        updatedAt: true,
      },
      sort: '-updatedAt',
      where: publishedWhere,
    }),
  ])

  const tagByID = new Map(tags.map((tag) => [tag.id, tag]))
  const contributorUserIDs = Array.from(
    new Set(
      wikiWithAuthors.docs.flatMap((doc) => {
        const user = doc.createdBy
        if (!user || typeof user !== 'object' || !('id' in user) || typeof user.id !== 'number') {
          return []
        }

        return [user.id]
      }),
    ),
  )

  const visiblePeopleResult =
    contributorUserIDs.length > 0
      ? await payload.find({
          collection: 'people',
          depth: 1,
          limit: contributorUserIDs.length,
          overrideAccess: false,
          pagination: false,
          select: {
            avatar: true,
            slug: true,
            user: true,
          },
          where: {
            user: {
              in: contributorUserIDs,
            },
          },
        })
      : { docs: [] as Array<Record<string, unknown>> }

  const peopleByUserID = new Map<number, { avatar: string | null; slug: string | null }>()
  visiblePeopleResult.docs.forEach((rawPerson) => {
    const person = rawPerson as {
      avatar?: unknown
      slug?: string | null
      user?: unknown
    }
    const linkedUser = person.user
    const userID =
      linkedUser &&
      typeof linkedUser === 'object' &&
      'id' in linkedUser &&
      typeof linkedUser.id === 'number'
        ? linkedUser.id
        : typeof linkedUser === 'number'
          ? linkedUser
          : null
    if (userID === null) return

    const avatar =
      person.avatar &&
      typeof person.avatar === 'object' &&
      'url' in person.avatar &&
      typeof person.avatar.url === 'string'
        ? person.avatar.url
        : null

    peopleByUserID.set(userID, {
      avatar,
      slug: typeof person.slug === 'string' ? person.slug : null,
    })
  })

  const contributorMap = new Map<number, WikiContributorInfo>()
  wikiWithAuthors.docs.forEach((doc) => {
    const user = doc.createdBy
    if (!user || typeof user !== 'object' || !('id' in user) || typeof user.id !== 'number') return

    const existing = contributorMap.get(user.id)
    if (existing) {
      existing.wikiCount += 1
      return
    }

    const linkedPerson = peopleByUserID.get(user.id)
    contributorMap.set(user.id, {
      avatar: linkedPerson?.avatar || null,
      email: typeof user.email === 'string' ? user.email : null,
      name:
        typeof user.name === 'string' && user.name.trim()
          ? user.name
          : typeof user.email === 'string'
            ? user.email
            : 'Anonymous',
      slug: linkedPerson?.slug || null,
      wikiCount: 1,
    })
  })

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

  const allItems: WikiIndexItem[] = wikiDocs.map((doc) => ({
    incomingLinks: incomingLinkCount.get(String(doc.id)) || 0,
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
    updatedAt: doc.updatedAt,
  }))

  const featured = [...allItems].sort((a, b) => b.incomingLinks - a.incomingLinks).slice(0, 6)
  const recent = [...allItems]
    .sort((a, b) => {
      const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return bDate - aDate
    })
    .slice(0, 6)

  return {
    allItems,
    contributors: Array.from(contributorMap.values())
      .sort((a, b) => b.wikiCount - a.wikiCount)
      .slice(0, 8),
    featured,
    recent,
  }
}

export const getCachedWikiIndexData = () =>
  unstable_cache(getWikiIndexData, ['wiki-index-data'], {
    revalidate: 1800,
    tags: ['wiki_index'],
  })
