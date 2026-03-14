import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateWiki: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (isRevalidateDisabled(context)) return doc

  const revalidateCollectionPages = () => {
    safeRevalidate(payload, 'wiki list', () => revalidatePath('/wiki'))
    safeRevalidate(payload, 'wiki graph page', () => revalidatePath('/wiki/graph'))
    safeRevalidate(payload, 'wiki list cache', () => revalidateTag('wiki_list'))
    safeRevalidate(payload, 'wiki graph cache', () => revalidateTag('wiki_graph'))
    safeRevalidate(payload, 'wiki index cache', () => revalidateTag('wiki_index'))
    safeRevalidate(payload, 'search results cache', () => revalidateTag('search_results'))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
  }

  if (doc?._status === 'published') {
    const currentPath = `/wiki/${doc.slug}`
    payload.logger.info(`Revalidating wiki page at path: ${currentPath}`)
    revalidateCollectionPages()
    safeRevalidate(payload, 'wiki detail page', () => revalidatePath(currentPath))
    safeRevalidate(payload, 'wiki detail cache', () => revalidateTag(`wiki_${doc.slug}`))
  }

  const shouldRevalidatePreviousPath =
    previousDoc?._status === 'published' &&
    (doc?._status !== 'published' || previousDoc.slug !== doc.slug)

  if (shouldRevalidatePreviousPath) {
    const previousPath = `/wiki/${previousDoc.slug}`
    payload.logger.info(`Revalidating previous wiki page at path: ${previousPath}`)
    revalidateCollectionPages()
    safeRevalidate(payload, 'previous wiki detail page', () => revalidatePath(previousPath))
    safeRevalidate(payload, 'previous wiki detail cache', () =>
      revalidateTag(`wiki_${previousDoc.slug}`),
    )
  }

  return doc
}

export const revalidateWikiDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { context, payload },
}) => {
  if (isRevalidateDisabled(context)) return doc

  safeRevalidate(payload, 'wiki list', () => revalidatePath('/wiki'))
  safeRevalidate(payload, 'wiki graph page', () => revalidatePath('/wiki/graph'))
  safeRevalidate(payload, 'wiki detail page', () => revalidatePath(`/wiki/${doc?.slug}`))
  safeRevalidate(payload, 'wiki list cache', () => revalidateTag('wiki_list'))
  safeRevalidate(payload, 'wiki graph cache', () => revalidateTag('wiki_graph'))
  safeRevalidate(payload, 'wiki index cache', () => revalidateTag('wiki_index'))
  safeRevalidate(payload, 'wiki detail cache', () => revalidateTag(`wiki_${doc?.slug}`))
  safeRevalidate(payload, 'search results cache', () => revalidateTag('search_results'))
  safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))

  return doc
}
