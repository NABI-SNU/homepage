import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Person } from '@/payload-types'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidatePerson: CollectionAfterChangeHook<Person> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (!isRevalidateDisabled(context)) {
    safeRevalidate(payload, 'people list', () => revalidatePath('/people'))
    safeRevalidate(payload, 'person page', () => revalidatePath(`/people/${doc.slug}`))
    safeRevalidate(payload, 'people list cache', () => revalidateTag('people_list', { expire: 0 }))
    safeRevalidate(payload, 'people slugs cache', () =>
      revalidateTag('people_slugs', { expire: 0 }),
    )
    safeRevalidate(payload, 'person detail cache', () =>
      revalidateTag(`person_${doc.slug}`, { expire: 0 }),
    )
    safeRevalidate(payload, 'wiki index cache', () => revalidateTag('wiki_index', { expire: 0 }))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap', { expire: 0 }))
    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      safeRevalidate(payload, 'previous person page', () =>
        revalidatePath(`/people/${previousDoc.slug}`),
      )
      safeRevalidate(payload, 'previous person detail cache', () =>
        revalidateTag(`person_${previousDoc.slug}`, { expire: 0 }),
      )
    }
  }

  return doc
}

export const revalidatePersonDelete: CollectionAfterDeleteHook<Person> = ({
  doc,
  req: { context, payload },
}) => {
  if (!isRevalidateDisabled(context)) {
    safeRevalidate(payload, 'people list', () => revalidatePath('/people'))
    safeRevalidate(payload, 'person delete page', () => revalidatePath(`/people/${doc?.slug}`))
    safeRevalidate(payload, 'people list cache', () => revalidateTag('people_list', { expire: 0 }))
    safeRevalidate(payload, 'people slugs cache', () =>
      revalidateTag('people_slugs', { expire: 0 }),
    )
    safeRevalidate(payload, 'person detail cache', () =>
      revalidateTag(`person_${doc?.slug}`, { expire: 0 }),
    )
    safeRevalidate(payload, 'wiki index cache', () => revalidateTag('wiki_index', { expire: 0 }))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap', { expire: 0 }))
  }

  return doc
}
