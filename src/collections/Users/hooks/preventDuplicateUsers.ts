import type { CollectionBeforeValidateHook, Where } from 'payload'
import { ValidationError } from 'payload'

import type { User } from '@/payload-types'

const normalizeEmail = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

const normalizeName = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(/\s+/g, ' ').toLowerCase()
  return normalized.length > 0 ? normalized : null
}

const fail = (path: string, message: string): never => {
  throw new ValidationError({
    collection: 'users',
    errors: [{ message, path }],
  })
}

/**
 * One user per human.
 *
 * - Two login accounts with the same email are impossible (unique index; emails are lower-cased).
 * - Two *profile-only* members (no login email) may not share a contact email.
 * - Two members with no email at all may not share a name.
 *
 * A login account and a profile-only member sharing an address is allowed on purpose: that is
 * the pending state right after a listed member signs up, and the two are merged once the email
 * is verified (see `syncBetterAuthUserToPayload`).
 */
export const preventDuplicateUsers: CollectionBeforeValidateHook<User> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data || typeof data !== 'object') return data

  const loginEmail = normalizeEmail(data.email ?? originalDoc?.email)
  const contactEmail = normalizeEmail(data.contactEmail ?? originalDoc?.contactEmail)
  const name = normalizeName(data.name ?? originalDoc?.name)
  const currentID = originalDoc?.id

  if ('contactEmail' in data && contactEmail) {
    data.contactEmail = contactEmail
  }

  const notSelf: Where[] = currentID != null ? [{ id: { not_equals: currentID } }] : []

  const findOthers = async (where: Where) =>
    (
      await req.payload.find({
        collection: 'users',
        depth: 0,
        limit: 5,
        overrideAccess: true,
        pagination: false,
        req,
        select: { contactEmail: true, email: true, name: true },
        where: { and: [where, ...notSelf] },
      })
    ).docs

  if (!loginEmail && contactEmail) {
    const others = await findOthers({ contactEmail: { equals: contactEmail } })
    const conflict = others.find((doc) => !normalizeEmail(doc.email))
    if (conflict) {
      fail(
        'contactEmail',
        `Another member (#${conflict.id}) is already listed with ${contactEmail}. Merge the two records instead of creating a duplicate.`,
      )
    }
  }

  if (!loginEmail && !contactEmail && name) {
    const others = await findOthers({ name: { like: name } })
    const conflict = others.find(
      (doc) =>
        normalizeName(doc.name) === name &&
        !normalizeEmail(doc.email) &&
        !normalizeEmail(doc.contactEmail),
    )
    if (conflict) {
      fail(
        'name',
        `Another member (#${conflict.id}) already has the name "${data.name}" and no email. Add a contact email to distinguish them, or merge the records.`,
      )
    }
  }

  return data
}
