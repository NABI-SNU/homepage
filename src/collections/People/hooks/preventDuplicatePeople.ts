import type { CollectionBeforeValidateHook, Where } from 'payload'
import { ValidationError } from 'payload'

import type { Person } from '@/payload-types'

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

/**
 * One Person per human: refuses to save a Person whose email (case-insensitive) is already used
 * by another Person, or whose name matches another Person with no email on either side.
 * Emails are stored lower-cased so the check stays exact.
 */
export const preventDuplicatePeople: CollectionBeforeValidateHook<Person> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data || typeof data !== 'object') return data

  const email = normalizeEmail(data.email ?? originalDoc?.email)
  const name = normalizeName(data.name ?? originalDoc?.name)
  const currentID = originalDoc?.id

  if (email) {
    data.email = email
  }

  const conditions: Where[] = []
  if (email) conditions.push({ email: { equals: email } })
  if (name && !email) conditions.push({ name: { like: name } })
  if (conditions.length === 0) return data

  const duplicates = await req.payload.find({
    collection: 'people',
    depth: 0,
    limit: 5,
    overrideAccess: true,
    pagination: false,
    req,
    select: { email: true, name: true },
    where: {
      and: [{ or: conditions }, ...(currentID != null ? [{ id: { not_equals: currentID } }] : [])],
    },
  })

  const conflict = duplicates.docs.find((doc) => {
    if (email && normalizeEmail(doc.email) === email) return true
    if (!email && !normalizeEmail(doc.email) && normalizeName(doc.name) === name) return true
    return false
  })

  if (conflict) {
    throw new ValidationError({
      collection: 'people',
      errors: [
        {
          message: email
            ? `Another person (#${conflict.id}) already uses the email ${email}. Merge the two records instead of creating a duplicate.`
            : `Another person (#${conflict.id}) already has the name "${data.name}". Add an email to distinguish them, or merge the records.`,
          path: email ? 'email' : 'name',
        },
      ],
    })
  }

  return data
}
