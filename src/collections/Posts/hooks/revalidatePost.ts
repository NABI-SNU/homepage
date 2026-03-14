import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

import type { Post } from '../../../payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!isRevalidateDisabled(context)) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      safeRevalidate(payload, 'post page', () => revalidatePath(path))
      safeRevalidate(payload, 'about page', () => revalidatePath('/about'))
      safeRevalidate(payload, 'post detail cache', () => revalidateTag(`post_${doc.slug}`))
      safeRevalidate(payload, 'posts sitemap', () => revalidateTag('posts-sitemap'))
      safeRevalidate(payload, 'posts list cache', () => revalidateTag('posts_list'))
      safeRevalidate(payload, 'category posts cache', () => revalidateTag('posts_by_category'))
      safeRevalidate(payload, 'recent posts cache', () => revalidateTag('recent_posts'))
      safeRevalidate(payload, 'person posts cache', () => revalidateTag('person_posts'))
      safeRevalidate(payload, 'topic posts cache', () => revalidateTag('topic_posts'))
      safeRevalidate(payload, 'search results cache', () => revalidateTag('search_results'))
      safeRevalidate(payload, 'references page', () => revalidatePath('/references'))
      safeRevalidate(payload, 'references cache', () => revalidateTag('references_list'))
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      safeRevalidate(payload, 'old post page', () => revalidatePath(oldPath))
      safeRevalidate(payload, 'about page', () => revalidatePath('/about'))
      safeRevalidate(payload, 'old post detail cache', () =>
        revalidateTag(`post_${previousDoc.slug}`),
      )
      safeRevalidate(payload, 'posts sitemap', () => revalidateTag('posts-sitemap'))
      safeRevalidate(payload, 'posts list cache', () => revalidateTag('posts_list'))
      safeRevalidate(payload, 'category posts cache', () => revalidateTag('posts_by_category'))
      safeRevalidate(payload, 'recent posts cache', () => revalidateTag('recent_posts'))
      safeRevalidate(payload, 'person posts cache', () => revalidateTag('person_posts'))
      safeRevalidate(payload, 'topic posts cache', () => revalidateTag('topic_posts'))
      safeRevalidate(payload, 'search results cache', () => revalidateTag('search_results'))
      safeRevalidate(payload, 'references page', () => revalidatePath('/references'))
      safeRevalidate(payload, 'references cache', () => revalidateTag('references_list'))
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({
  doc,
  req: { context, payload },
}) => {
  if (!isRevalidateDisabled(context)) {
    const path = `/posts/${doc?.slug}`

    safeRevalidate(payload, 'post delete page', () => revalidatePath(path))
    safeRevalidate(payload, 'about page', () => revalidatePath('/about'))
    safeRevalidate(payload, 'post detail cache', () => revalidateTag(`post_${doc?.slug}`))
    safeRevalidate(payload, 'posts sitemap', () => revalidateTag('posts-sitemap'))
    safeRevalidate(payload, 'posts list cache', () => revalidateTag('posts_list'))
    safeRevalidate(payload, 'category posts cache', () => revalidateTag('posts_by_category'))
    safeRevalidate(payload, 'recent posts cache', () => revalidateTag('recent_posts'))
    safeRevalidate(payload, 'person posts cache', () => revalidateTag('person_posts'))
    safeRevalidate(payload, 'topic posts cache', () => revalidateTag('topic_posts'))
    safeRevalidate(payload, 'search results cache', () => revalidateTag('search_results'))
    safeRevalidate(payload, 'references page', () => revalidatePath('/references'))
    safeRevalidate(payload, 'references cache', () => revalidateTag('references_list'))
  }

  return doc
}
