import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { News } from '@/payload-types'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateNews: CollectionAfterChangeHook<News> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!isRevalidateDisabled(context)) {
    let revalidatedCollectionCaches = false

    const revalidateCollectionCaches = (): void => {
      if (revalidatedCollectionCaches) return

      safeRevalidate(payload, 'news list', () => revalidatePath('/news'))
      safeRevalidate(payload, 'news list cache', () => revalidateTag('news_list'))
      safeRevalidate(payload, 'search results cache', () => revalidateTag('search_results'))
      safeRevalidate(payload, 'references page', () => revalidatePath('/references'))
      safeRevalidate(payload, 'references cache', () => revalidateTag('references_list'))
      safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
      revalidatedCollectionCaches = true
    }

    if (doc._status === 'published') {
      const currentPath = `/news/${doc.slug}`
      payload.logger.info(`Revalidating news at path: ${currentPath}`)
      revalidateCollectionCaches()
      safeRevalidate(payload, 'news page', () => revalidatePath(currentPath))
      safeRevalidate(payload, 'news detail cache', () => revalidateTag(`news_${doc.slug}`))
    }

    const shouldRevalidatePreviousPath =
      previousDoc?._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)

    if (shouldRevalidatePreviousPath) {
      const previousPath = `/news/${previousDoc.slug}`
      payload.logger.info(`Revalidating previous news path: ${previousPath}`)
      revalidateCollectionCaches()
      safeRevalidate(payload, 'previous news page', () => revalidatePath(previousPath))
      safeRevalidate(payload, 'previous news detail cache', () =>
        revalidateTag(`news_${previousDoc.slug}`),
      )
    }
  }

  return doc
}

export const revalidateNewsDelete: CollectionAfterDeleteHook<News> = ({
  doc,
  req: { context, payload },
}) => {
  if (!isRevalidateDisabled(context)) {
    safeRevalidate(payload, 'news list', () => revalidatePath('/news'))
    safeRevalidate(payload, 'news list cache', () => revalidateTag('news_list'))
    safeRevalidate(payload, 'news delete page', () => revalidatePath(`/news/${doc?.slug}`))
    safeRevalidate(payload, 'news detail cache', () => revalidateTag(`news_${doc?.slug}`))
    safeRevalidate(payload, 'search results cache', () => revalidateTag('search_results'))
    safeRevalidate(payload, 'references page', () => revalidatePath('/references'))
    safeRevalidate(payload, 'references cache', () => revalidateTag('references_list'))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
  }

  return doc
}
