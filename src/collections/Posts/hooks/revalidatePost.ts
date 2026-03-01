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
      safeRevalidate(payload, 'posts sitemap', () => revalidateTag('posts-sitemap'))
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc._status === 'published' && doc._status !== 'published') {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      safeRevalidate(payload, 'old post page', () => revalidatePath(oldPath))
      safeRevalidate(payload, 'posts sitemap', () => revalidateTag('posts-sitemap'))
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context, payload } }) => {
  if (!isRevalidateDisabled(context)) {
    const path = `/posts/${doc?.slug}`

    safeRevalidate(payload, 'post delete page', () => revalidatePath(path))
    safeRevalidate(payload, 'posts sitemap', () => revalidateTag('posts-sitemap'))
  }

  return doc
}
