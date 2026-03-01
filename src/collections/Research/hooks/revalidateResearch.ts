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
    const path = `/labs/${doc.slug}`
    payload.logger.info(`Revalidating research at path: ${path}`)
    safeRevalidate(payload, 'labs list', () => revalidatePath('/labs'))
    safeRevalidate(payload, 'research page', () => revalidatePath(path))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))

    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      safeRevalidate(payload, 'previous research page', () => revalidatePath(`/labs/${previousDoc.slug}`))
      safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
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
    safeRevalidate(payload, 'research delete page', () => revalidatePath(`/labs/${doc?.slug}`))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
  }

  return doc
}
