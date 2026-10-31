import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { User } from '@/payload-types'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

const profileFields: Array<keyof User> = [
  'avatar',
  'bio',
  'email',
  'isAuthor',
  'isVisible',
  'memberType',
  'name',
  'research',
  'roleAssignments',
  'slug',
  'socials',
  'years',
]

const profileChanged = (doc: User, previousDoc?: User | null): boolean => {
  if (!previousDoc) return true
  return profileFields.some(
    (field) => JSON.stringify(doc[field] ?? null) !== JSON.stringify(previousDoc[field] ?? null),
  )
}

const revalidateProfileCaches = (
  payload: Parameters<typeof safeRevalidate>[0],
  slug: string | null | undefined,
) => {
  safeRevalidate(payload, 'people list', () => revalidatePath('/people'))
  safeRevalidate(payload, 'people list cache', () => revalidateTag('people_list', { expire: 0 }))
  safeRevalidate(payload, 'people slugs cache', () => revalidateTag('people_slugs', { expire: 0 }))
  safeRevalidate(payload, 'wiki index cache', () => revalidateTag('wiki_index', { expire: 0 }))
  safeRevalidate(payload, 'site sitemap', () => revalidateTag('site-sitemap', { expire: 0 }))
  if (slug) {
    safeRevalidate(payload, 'person page', () => revalidatePath(`/people/${slug}`))
    safeRevalidate(payload, 'person detail cache', () =>
      revalidateTag(`person_${slug}`, { expire: 0 }),
    )
  }
}

/** Public profile pages live under /people; refresh them when a user's profile changes. */
export const revalidateUserProfile: CollectionAfterChangeHook<User> = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (isRevalidateDisabled(context)) return doc
  // Logins and session refreshes update users too; only profile edits need a revalidation.
  if (!profileChanged(doc, previousDoc)) return doc

  revalidateProfileCaches(payload, doc.slug)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    revalidateProfileCaches(payload, previousDoc.slug)
  }

  return doc
}

export const revalidateUserProfileDelete: CollectionAfterDeleteHook<User> = ({
  doc,
  req: { context, payload },
}) => {
  if (!isRevalidateDisabled(context)) {
    revalidateProfileCaches(payload, doc?.slug)
  }

  return doc
}
