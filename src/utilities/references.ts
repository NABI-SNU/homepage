import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

type Source = {
  type: 'posts' | 'news' | 'research'
  title: string
  url: string
}

export type ReferenceItem = {
  title: string
  authors: string[]
  journal?: string | null
  year?: number | null
  doi?: string | null
  url?: string | null
  sources: Source[]
}

const referenceKey = (title: string, authors: string[]) =>
  `${title.toLowerCase().trim()}|${authors.map((a) => a.toLowerCase().trim()).sort().join('|')}`

const getAllReferences = async (): Promise<ReferenceItem[]> => {
  const payload = await getPayload({ config: configPromise })

  const [posts, news, research] = await Promise.all([
    payload.find({
      collection: 'posts',
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
    }),
    payload.find({
      collection: 'news',
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
    }),
    payload.find({
      collection: 'research',
      depth: 0,
      limit: 1000,
      pagination: false,
      overrideAccess: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
    }),
  ])

  const merged = new Map<string, ReferenceItem>()

  const addReference = (
    ref: {
      title: string
      authors?: { name?: string | null }[] | null
      journal?: string | null
      year?: number | null
      doi?: string | null
      url?: string | null
    },
    source: Source,
  ) => {
    const authors = (ref.authors || []).map((author) => author?.name || '').filter(Boolean)
    const key = referenceKey(ref.title, authors)

    if (!merged.has(key)) {
      merged.set(key, {
        title: ref.title,
        authors,
        journal: ref.journal,
        year: ref.year,
        doi: ref.doi,
        url: ref.url,
        sources: [source],
      })
      return
    }

    const existing = merged.get(key)
    if (!existing) return

    const sourceExists = existing.sources.some((item) => item.type === source.type && item.url === source.url)

    if (!sourceExists) {
      existing.sources.push(source)
    }

    if (!existing.url && ref.url) existing.url = ref.url
    if (!existing.doi && ref.doi) existing.doi = ref.doi
    if (!existing.journal && ref.journal) existing.journal = ref.journal
    if (!existing.year && ref.year) existing.year = ref.year
  }

  for (const post of posts.docs) {
    for (const reference of post.references || []) {
      addReference(reference, {
        type: 'posts',
        title: post.title,
        url: `/posts/${post.slug}`,
      })
    }
  }

  for (const item of news.docs) {
    for (const reference of item.references || []) {
      addReference(reference, {
        type: 'news',
        title: item.title,
        url: `/news/${item.slug}`,
      })
    }
  }

  for (const item of research.docs) {
    for (const reference of item.references || []) {
      addReference(reference, {
        type: 'research',
        title: item.title,
        url: `/labs/${item.slug}`,
      })
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.title.localeCompare(b.title))
}

export const getCachedAllReferences = () =>
  unstable_cache(getAllReferences, ['references-list'], {
    revalidate: 600,
    tags: ['references_list'],
  })
