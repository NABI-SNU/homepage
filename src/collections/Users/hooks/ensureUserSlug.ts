import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

import type { User } from '@/payload-types'
import { toKebabCase } from '@/utilities/toKebabCase'

const sanitizeSlug = (value: string): string =>
  toKebabCase(value)
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

/**
 * Every user needs a unique public slug (`/people/<slug>`). Generate one from the name when none
 * is given, and make sure whatever ends up stored does not collide with another user — the
 * first "Seojin Lee" gets `seojin-lee`, the next `seojin-lee-2`.
 */
export const ensureUserSlug: CollectionBeforeValidateHook<User> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data || typeof data !== 'object') return data

  const requestedSlug = typeof data.slug === 'string' ? sanitizeSlug(data.slug) : ''
  const hasExistingSlug = Boolean(originalDoc?.slug) && !('slug' in data)

  // Payload requires a login email *or* a username on auth collections. Members without a
  // login have neither, so their username doubles as the slug.
  const loginEmail = (data.email ?? originalDoc?.email) as string | null | undefined
  const assignUsername = (slug: string) => {
    if (!loginEmail && !(data.username ?? originalDoc?.username)) data.username = slug
  }

  if (hasExistingSlug && operation === 'update') {
    if (originalDoc?.slug) assignUsername(originalDoc.slug)
    return data
  }

  const name = typeof data.name === 'string' ? data.name : originalDoc?.name
  const base = requestedSlug || sanitizeSlug(name || '') || 'member'
  const currentID = originalDoc?.id

  const isTaken = async (candidate: string): Promise<boolean> => {
    const result = await req.payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        and: [
          { slug: { equals: candidate } },
          ...(currentID != null ? [{ id: { not_equals: currentID } }] : []),
        ],
      },
    })
    return result.docs.length > 0
  }

  if (requestedSlug) {
    if (await isTaken(requestedSlug)) {
      throw new ValidationError({
        collection: 'users',
        errors: [
          {
            message: `The slug "${requestedSlug}" is already used by another member.`,
            path: 'slug',
          },
        ],
      })
    }
    data.slug = requestedSlug
    assignUsername(requestedSlug)
    return data
  }

  let candidate = base
  for (let attempt = 2; await isTaken(candidate); attempt += 1) {
    candidate = `${base}-${attempt}`
  }

  data.slug = candidate
  assignUsername(candidate)
  return data
}
