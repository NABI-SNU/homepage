import type { CollectionBeforeValidateHook } from 'payload'

import type { User } from '@/payload-types'

/**
 * Emails are compared case-insensitively everywhere else in the auth pipeline, but the unique
 * index on `users.email` is case-sensitive. Lower-casing on write keeps "Kim@x.com" and
 * "kim@x.com" from becoming two accounts for the same person.
 */
export const normalizeUserEmail: CollectionBeforeValidateHook<User> = ({ data }) => {
  if (!data || typeof data !== 'object') return data

  if (typeof data.email === 'string') {
    const normalized = data.email.trim().toLowerCase()
    if (normalized.length > 0) {
      data.email = normalized
    }
  }

  return data
}
