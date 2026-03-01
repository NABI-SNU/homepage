import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { News } from '@/payload-types'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateNews: CollectionAfterChangeHook<News> = ({ doc, previousDoc, req: { payload, context } }) => {
  if (!isRevalidateDisabled(context)) {
    const path = `/news/${doc.slug}`
    payload.logger.info(`Revalidating news at path: ${path}`)
    safeRevalidate(payload, 'news list', () => revalidatePath('/news'))
    safeRevalidate(payload, 'news page', () => revalidatePath(path))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))

    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      safeRevalidate(payload, 'previous news page', () => revalidatePath(`/news/${previousDoc.slug}`))
      safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
    }
  }

  return doc
}

export const revalidateNewsDelete: CollectionAfterDeleteHook<News> = ({ doc, req: { context, payload } }) => {
  if (!isRevalidateDisabled(context)) {
    safeRevalidate(payload, 'news list', () => revalidatePath('/news'))
    safeRevalidate(payload, 'news delete page', () => revalidatePath(`/news/${doc?.slug}`))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
  }

  return doc
}
