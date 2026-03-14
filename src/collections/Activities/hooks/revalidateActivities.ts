import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import type { Activity } from '@/payload-types'

import { revalidatePath, revalidateTag } from 'next/cache'

import { getActivityPath } from '@/utilities/activityURL'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

const getYearFromISODate = (date: string | null | undefined): number | null => {
  if (!date) return null
  const timestamp = Date.parse(date)
  if (!Number.isFinite(timestamp)) return null
  return new Date(timestamp).getUTCFullYear()
}

const getActivitySlugTag = (
  activityType: string | null | undefined,
  slug: string | null | undefined,
): string | null => {
  if (!slug) return null
  if (activityType !== 'conference' && activityType !== 'symposium') return null
  return `activities_${activityType}_slug_${slug}`
}

export const revalidateActivities: CollectionAfterChangeHook<Activity> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!isRevalidateDisabled(context)) {
    let revalidatedCollectionCaches = false

    const revalidateCollectionCaches = (): void => {
      if (revalidatedCollectionCaches) return

      safeRevalidate(payload, 'symposium page', () => revalidatePath('/symposium'))
      safeRevalidate(payload, 'conferences list', () => revalidatePath('/conferences'))
      safeRevalidate(payload, 'symposium list cache', () => revalidateTag('symposium_list'))
      safeRevalidate(payload, 'conference years cache', () =>
        revalidateTag('activities_conference_years'),
      )
      safeRevalidate(payload, 'conference slugs cache', () =>
        revalidateTag('activities_conference_slugs'),
      )
      safeRevalidate(payload, 'symposium slugs cache', () =>
        revalidateTag('activities_symposium_slugs'),
      )
      safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
      revalidatedCollectionCaches = true
    }

    if (doc._status === 'published') {
      const currentPath = getActivityPath(doc)

      payload.logger.info(`Revalidating activity at path: ${currentPath}`)
      revalidateCollectionCaches()

      if (currentPath) {
        safeRevalidate(payload, 'activity page', () => revalidatePath(currentPath))
      }

      const currentSlugTag = getActivitySlugTag(doc.activityType, doc.slug)
      if (currentSlugTag) {
        safeRevalidate(payload, 'activity slug cache', () => revalidateTag(currentSlugTag))
      }
    }

    const currentPath = getActivityPath(doc)
    const previousPath = previousDoc ? getActivityPath(previousDoc) : null
    const shouldRevalidatePreviousPath =
      previousDoc?._status === 'published' &&
      (doc._status !== 'published' || previousPath !== currentPath)

    if (shouldRevalidatePreviousPath && previousPath) {
      payload.logger.info(`Revalidating previous activity path: ${previousPath}`)
      revalidateCollectionCaches()
      safeRevalidate(payload, 'previous activity page', () => revalidatePath(previousPath))
    }

    const previousSlugTag = getActivitySlugTag(previousDoc?.activityType, previousDoc?.slug)
    if (previousSlugTag) {
      safeRevalidate(payload, 'previous activity slug cache', () => revalidateTag(previousSlugTag))
    }

    const conferenceYearsToInvalidate = new Set<number>()
    const currentConferenceYear =
      doc.activityType === 'conference' ? getYearFromISODate(doc.date) : null
    const previousConferenceYear =
      previousDoc?.activityType === 'conference' ? getYearFromISODate(previousDoc.date) : null

    if (currentConferenceYear) conferenceYearsToInvalidate.add(currentConferenceYear)
    if (previousConferenceYear) conferenceYearsToInvalidate.add(previousConferenceYear)

    conferenceYearsToInvalidate.forEach((year) => {
      safeRevalidate(payload, `conference year cache ${year}`, () =>
        revalidateTag(`activities_conference_year_${year}`),
      )
    })
  }

  return doc
}

export const revalidateActivitiesDelete: CollectionAfterDeleteHook<Activity> = ({
  doc,
  req: { context, payload },
}) => {
  if (!isRevalidateDisabled(context)) {
    safeRevalidate(payload, 'symposium page', () => revalidatePath('/symposium'))
    safeRevalidate(payload, 'conferences list', () => revalidatePath('/conferences'))
    safeRevalidate(payload, 'symposium list cache', () => revalidateTag('symposium_list'))
    safeRevalidate(payload, 'conference years cache', () =>
      revalidateTag('activities_conference_years'),
    )
    safeRevalidate(payload, 'conference slugs cache', () =>
      revalidateTag('activities_conference_slugs'),
    )
    safeRevalidate(payload, 'symposium slugs cache', () =>
      revalidateTag('activities_symposium_slugs'),
    )

    const slugTag = getActivitySlugTag(doc.activityType, doc.slug)
    if (slugTag) {
      safeRevalidate(payload, 'activity slug cache', () => revalidateTag(slugTag))
    }

    if (doc.activityType === 'conference') {
      const year = getYearFromISODate(doc.date)
      if (year) {
        safeRevalidate(payload, `conference year cache ${year}`, () =>
          revalidateTag(`activities_conference_year_${year}`),
        )
      }
    }

    const path = getActivityPath(doc)
    if (path) {
      safeRevalidate(payload, 'activity delete page', () => revalidatePath(path))
    }

    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
  }

  return doc
}
