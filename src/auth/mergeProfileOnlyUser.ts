import type { Payload } from 'payload'

import type { User } from '@/payload-types'

/**
 * Profile fields that move from a profile-only member record onto the login account that
 * claimed it. The login account's own value wins only where the profile has nothing.
 */
const PROFILE_FIELDS = [
  'avatar',
  'bio',
  'contactEmail',
  'isAuthor',
  'isVisible',
  'memberType',
  'research',
  'roleAssignments',
  'socials',
  'years',
] as const

const relationshipID = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'number') {
    return (value as { id: number }).id
  }
  return null
}

const isEmpty = (value: unknown): boolean =>
  value == null || value === '' || (Array.isArray(value) && value.length === 0)

/** A member record created by an admin that nobody has signed in with yet. */
export const findProfileOnlyUserByContactEmail = async ({
  email,
  excludeUserID,
  payload,
}: {
  email: string
  excludeUserID: number
  payload: Payload
}): Promise<User | null> => {
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 5,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ contactEmail: { equals: email } }, { id: { not_equals: excludeUserID } }],
    },
  })

  return result.docs.find((doc) => !doc.email?.trim()) ?? null
}

/**
 * Moves everything that made `from` a member — profile fields, slug, post authorship — onto the
 * login account `into`, then deletes `from`. Called once the account has verified that it owns
 * the profile's contact email.
 */
export const mergeProfileOnlyUser = async ({
  from,
  into,
  payload,
}: {
  from: User
  into: User
  payload: Payload
}): Promise<void> => {
  // 1. Re-point authorship. Relationship rows cascade on user delete (current documents *and*
  //    version history), so this must happen first, and it is done in SQL: a Payload update would
  //    trip required-field validation on unfinished drafts and only write a new version.
  const db = payload.db as unknown as {
    drizzle: unknown
    execute: (args: { drizzle: unknown; raw: string }) => Promise<unknown>
  }
  const repoint = async (table: string, path: string) => {
    // Drop rows that would duplicate an existing `into` author on the same document, then move.
    await db.execute({
      drizzle: db.drizzle,
      raw: `DELETE FROM "${table}" f USING "${table}" t
            WHERE f.users_id = ${from.id} AND t.users_id = ${into.id}
              AND f.parent_id = t.parent_id AND f.path = t.path AND f.path = '${path}'`,
    })
    await db.execute({
      drizzle: db.drizzle,
      raw: `UPDATE "${table}" SET users_id = ${into.id} WHERE users_id = ${from.id} AND path = '${path}'`,
    })
  }
  await repoint('posts_rels', 'authors')
  await repoint('_posts_v_rels', 'version.authors')

  // 2. Collect the profile, remembering the slug so the public URL survives the merge.
  const patch: Record<string, unknown> = {}
  for (const field of PROFILE_FIELDS) {
    const fromValue = from[field]
    if (isEmpty(fromValue)) continue
    if (field === 'avatar') {
      const avatarID = relationshipID(fromValue)
      if (avatarID != null && isEmpty(into.avatar)) patch.avatar = avatarID
      continue
    }
    if (field === 'isVisible' || field === 'memberType' || field === 'roleAssignments') {
      patch[field] = fromValue
      continue
    }
    if (isEmpty(into[field])) patch[field] = fromValue
  }
  if (from.name?.trim() && (!into.name?.trim() || into.name === into.email?.split('@')[0])) {
    patch.name = from.name
  }
  const slug = from.slug

  // 3. Hand the profile over *before* deleting anything, so a failure leaves both records in
  //    place (the profile-only one renamed and hidden) instead of losing the profile. The slug
  //    and username are unique, so the old record gives them up first.
  if (slug) {
    await payload.update({
      collection: 'users',
      id: from.id,
      data: {
        isVisible: false,
        slug: `${slug}-merged-${from.id}`,
        username: `${slug}-merged-${from.id}`,
      },
      context: { disableRevalidate: true },
      depth: 0,
      overrideAccess: true,
    })
    patch.slug = slug
  }

  if (Object.keys(patch).length > 0) {
    await payload.update({
      collection: 'users',
      id: into.id,
      data: patch,
      depth: 0,
      overrideAccess: true,
    })
  }

  // 4. Nothing references the profile-only record any more.
  await payload.delete({
    collection: 'users',
    id: from.id,
    context: { disableRevalidate: true },
    depth: 0,
    overrideAccess: true,
  })

  payload.logger.info(
    `[auth] Merged profile-only member ${from.id} (${from.contactEmail}) into user ${into.id}.`,
  )
}
