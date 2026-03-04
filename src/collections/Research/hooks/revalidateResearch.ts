import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Research } from '@/payload-types'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateResearch: CollectionAfterChangeHook<Research> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!isRevalidateDisabled(context)) {
    let revalidatedCollectionCaches = false

    const revalidateCollectionCaches = (): void => {
      if (revalidatedCollectionCaches) return

      safeRevalidate(payload, 'labs list', () => revalidatePath('/labs'))
      safeRevalidate(payload, 'references page', () => revalidatePath('/references'))
      safeRevalidate(payload, 'references cache', () => revalidateTag('references_list'))
      safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
      revalidatedCollectionCaches = true
    }

    if (doc._status === 'published') {
      const currentPath = `/labs/${doc.slug}`
      payload.logger.info(`Revalidating research at path: ${currentPath}`)
      revalidateCollectionCaches()
      safeRevalidate(payload, 'research page', () => revalidatePath(currentPath))
    }

    const shouldRevalidatePreviousPath =
      previousDoc?._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)

    if (shouldRevalidatePreviousPath) {
      const previousPath = `/labs/${previousDoc.slug}`
      payload.logger.info(`Revalidating previous research path: ${previousPath}`)
      revalidateCollectionCaches()
      safeRevalidate(payload, 'previous research page', () => revalidatePath(previousPath))
    }
  }

  return doc
}

export const revalidateResearchDelete: CollectionAfterDeleteHook<Research> = ({
  doc,
  req: { context, payload },
}) => {
  if (!isRevalidateDisabled(context)) {
    safeRevalidate(payload, 'labs list', () => revalidatePath('/labs'))
    safeRevalidate(payload, 'references page', () => revalidatePath('/references'))
    safeRevalidate(payload, 'references cache', () => revalidateTag('references_list'))
    safeRevalidate(payload, 'research delete page', () => revalidatePath(`/labs/${doc?.slug}`))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
  }

  return doc
}
