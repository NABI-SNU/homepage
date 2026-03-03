import type { CollectionAfterChangeHook } from 'payload'

import type { Person, Tag } from '@/payload-types'
import { parseResearchTags, toTagSlug } from '@/utilities/researchTags'

const SYNC_CONTEXT_FLAG = 'disableResearchTagSync'

const toNormalizedTagSlugs = (tags: string[]): string[] =>
  Array.from(new Set(tags.map((tag) => toTagSlug(tag)).filter(Boolean))).sort()

export const syncResearchTagsFromPerson: CollectionAfterChangeHook<Person> = async ({
  doc,
  previousDoc,
  req,
  req: { payload, context },
}) => {
  if ((context as Record<string, unknown> | undefined)?.[SYNC_CONTEXT_FLAG]) {
    return doc
  }

  const tagTitles = parseResearchTags(doc.research)
  const tagSlugs = toNormalizedTagSlugs(tagTitles)

  if (previousDoc) {
    const previousTagSlugs = toNormalizedTagSlugs(parseResearchTags(previousDoc.research))
    const didTagsChange =
      previousTagSlugs.length !== tagSlugs.length ||
      previousTagSlugs.some((slug, index) => slug !== tagSlugs[index])

    if (!didTagsChange) return doc
  }

  if (tagTitles.length === 0) {
    return doc
  }

  const existingTags = await payload.find({
    collection: 'tags',
    depth: 0,
    limit: tagSlugs.length || 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      slug: {
        in: tagSlugs,
      },
    },
  })

  const existingTagSlugs = new Set(
    existingTags.docs
      .map((tag) => (typeof tag === 'object' ? tag.slug : null))
      .filter((slug): slug is string => typeof slug === 'string'),
  )

  const titleBySlug = new Map<string, string>()
  for (const title of tagTitles) {
    const slug = toTagSlug(title)
    if (!slug || titleBySlug.has(slug)) continue
    titleBySlug.set(slug, title)
  }

  for (const [slug, title] of titleBySlug) {
    if (existingTagSlugs.has(slug)) continue

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

    existingTagSlugs.add(slug)
  }

  const syncedTags = await payload.find({
    collection: 'tags',
    depth: 0,
    limit: tagSlugs.length || 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      slug: {
        in: tagSlugs,
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
