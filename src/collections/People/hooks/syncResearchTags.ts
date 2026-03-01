import type { CollectionAfterChangeHook } from 'payload'

import type { Person, Tag } from '@/payload-types'
import { parseResearchTags, toTagSlug } from '@/utilities/researchTags'

const SYNC_CONTEXT_FLAG = 'disableResearchTagSync'

export const syncResearchTagsFromPerson: CollectionAfterChangeHook<Person> = async ({
  doc,
  req,
  req: { payload, context },
}) => {
  if ((context as Record<string, unknown> | undefined)?.[SYNC_CONTEXT_FLAG]) {
    return doc
  }

  const tagTitles = parseResearchTags(doc.research)
  if (tagTitles.length === 0) {
    return doc
  }

  for (const title of tagTitles) {
    const slug = toTagSlug(title)
    if (!slug) continue

    const existing = await payload.find({
      collection: 'tags',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    if (existing.docs[0]) continue

    await payload.create({
      collection: 'tags',
      context: {
        ...(context || {}),
        disableRevalidate: true,
        [SYNC_CONTEXT_FLAG]: true,
      },
      data: {
        title,
        slug,
      },
      overrideAccess: true,
      req,
    })
  }

  const syncedTags = await payload.find({
    collection: 'tags',
    depth: 0,
    limit: tagTitles.length || 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      slug: {
        in: tagTitles.map((title) => toTagSlug(title)).filter(Boolean),
      },
    },
  })

  const syncedTagIDs = syncedTags.docs
    .map((tag) => (typeof tag === 'object' ? tag.id : tag))
    .filter((tagID): tagID is number => typeof tagID === 'number')

  if (syncedTagIDs.length === 0) return doc

  const authoredPosts = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    req,
    select: {
      tags: true,
    },
    where: {
      authors: {
        contains: doc.id,
      },
    },
  })

  const extractTagID = (tag: number | Tag | null | undefined): number | null => {
    if (typeof tag === 'number') return tag
    if (tag && typeof tag === 'object') {
      const maybeID = (tag as Tag).id
      if (typeof maybeID === 'number') return maybeID
    }
    return null
  }

  for (const post of authoredPosts.docs) {
    const currentTagIDs = (post.tags || [])
      .map((tag) => extractTagID(tag as number | Tag | null | undefined))
      .filter((id): id is number => typeof id === 'number')

    const nextTagIDs = Array.from(new Set([...currentTagIDs, ...syncedTagIDs]))
    if (nextTagIDs.length === currentTagIDs.length) continue

    await payload.update({
      collection: 'posts',
      id: post.id,
      data: {
        tags: nextTagIDs,
      },
      context: {
        ...(context || {}),
        disableRevalidate: true,
        [SYNC_CONTEXT_FLAG]: true,
      },
      overrideAccess: true,
      req,
    })
  }

  return doc
}
