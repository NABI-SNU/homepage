import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Tag } from '@/payload-types'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateTags: CollectionAfterChangeHook<Tag> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (isRevalidateDisabled(context)) return doc

  safeRevalidate(payload, 'topics list cache', () => revalidateTag('topics_list', { expire: 0 }))
  safeRevalidate(payload, 'topic posts cache', () => revalidateTag('topic_posts', { expire: 0 }))
  safeRevalidate(payload, 'wiki list cache', () => revalidateTag('wiki_list', { expire: 0 }))
  safeRevalidate(payload, 'wiki index cache', () => revalidateTag('wiki_index', { expire: 0 }))

  if (doc?.slug) {
    safeRevalidate(payload, 'topic page', () => revalidatePath(`/topics/${doc.slug}`))
    safeRevalidate(payload, 'topic cache', () => revalidateTag(`topic_${doc.slug}`, { expire: 0 }))
  }

  if (previousDoc?.slug && previousDoc.slug !== doc?.slug) {
    safeRevalidate(payload, 'previous topic page', () =>
      revalidatePath(`/topics/${previousDoc.slug}`),
    )
    safeRevalidate(payload, 'previous topic cache', () =>
      revalidateTag(`topic_${previousDoc.slug}`, { expire: 0 }),
    )
  }

  return doc
}

export const revalidateTagsDelete: CollectionAfterDeleteHook<Tag> = ({
  doc,
  req: { context, payload },
}) => {
  if (isRevalidateDisabled(context)) return doc

  safeRevalidate(payload, 'topics list cache', () => revalidateTag('topics_list', { expire: 0 }))
  safeRevalidate(payload, 'topic posts cache', () => revalidateTag('topic_posts', { expire: 0 }))
  safeRevalidate(payload, 'wiki list cache', () => revalidateTag('wiki_list', { expire: 0 }))
  safeRevalidate(payload, 'wiki index cache', () => revalidateTag('wiki_index', { expire: 0 }))

  if (doc?.slug) {
    safeRevalidate(payload, 'topic delete page', () => revalidatePath(`/topics/${doc.slug}`))
    safeRevalidate(payload, 'topic cache', () => revalidateTag(`topic_${doc.slug}`, { expire: 0 }))
  }

  return doc
}
