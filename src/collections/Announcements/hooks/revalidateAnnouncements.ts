import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Announcement } from '@/payload-types'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateAnnouncements: CollectionAfterChangeHook<Announcement> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!isRevalidateDisabled(context)) {
    let revalidatedCollectionCaches = false

    const revalidateCollectionCaches = (): void => {
      if (revalidatedCollectionCaches) return

      safeRevalidate(payload, 'announcements list', () => revalidatePath('/announcements'))
      safeRevalidate(payload, 'announcements list cache', () => revalidateTag('announcements_list'))
      safeRevalidate(payload, 'announcements slugs cache', () =>
        revalidateTag('announcements_slugs'),
      )
      safeRevalidate(payload, 'references page', () => revalidatePath('/references'))
      safeRevalidate(payload, 'references cache', () => revalidateTag('references_list'))
      safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
      revalidatedCollectionCaches = true
    }

    if (doc._status === 'published') {
      const currentPath = `/announcements/${doc.slug}`
      payload.logger.info(`Revalidating announcement at path: ${currentPath}`)
      revalidateCollectionCaches()
      safeRevalidate(payload, 'announcement page', () => revalidatePath(currentPath))
      safeRevalidate(payload, 'announcement detail cache', () =>
        revalidateTag(`announcement_${doc.slug}`),
      )
    }

    const shouldRevalidatePreviousPath =
      previousDoc?._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)

    if (shouldRevalidatePreviousPath) {
      const previousPath = `/announcements/${previousDoc.slug}`
      payload.logger.info(`Revalidating previous announcement path: ${previousPath}`)
      revalidateCollectionCaches()
      safeRevalidate(payload, 'previous announcement page', () => revalidatePath(previousPath))
      safeRevalidate(payload, 'previous announcement detail cache', () =>
        revalidateTag(`announcement_${previousDoc.slug}`),
      )
    }
  }

  return doc
}

export const revalidateAnnouncementsDelete: CollectionAfterDeleteHook<Announcement> = ({
  doc,
  req: { context, payload },
}) => {
  if (!isRevalidateDisabled(context)) {
    safeRevalidate(payload, 'announcements list', () => revalidatePath('/announcements'))
    safeRevalidate(payload, 'announcements list cache', () => revalidateTag('announcements_list'))
    safeRevalidate(payload, 'announcements slugs cache', () => revalidateTag('announcements_slugs'))
    safeRevalidate(payload, 'announcement delete page', () =>
      revalidatePath(`/announcements/${doc?.slug}`),
    )
    safeRevalidate(payload, 'announcement detail cache', () =>
      revalidateTag(`announcement_${doc?.slug}`),
    )
    safeRevalidate(payload, 'references page', () => revalidatePath('/references'))
    safeRevalidate(payload, 'references cache', () => revalidateTag('references_list'))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
  }

  return doc
}
