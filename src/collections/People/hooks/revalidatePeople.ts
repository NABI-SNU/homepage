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
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      safeRevalidate(payload, 'previous person page', () => revalidatePath(`/people/${previousDoc.slug}`))
    }
  }

  return doc
}

export const revalidatePersonDelete: CollectionAfterDeleteHook<Person> = ({ doc, req: { context, payload } }) => {
  if (!isRevalidateDisabled(context)) {
    safeRevalidate(payload, 'people list', () => revalidatePath('/people'))
    safeRevalidate(payload, 'person delete page', () => revalidatePath(`/people/${doc?.slug}`))
    safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap'))
  }

  return doc
}
