import type { Payload } from 'payload'

import { toKebabCase } from '@/utilities/toKebabCase'

const BATCH_SIZE = 100

type PayloadUser = {
  email?: string | null
  id: number
  name?: string | null
}

type PayloadPerson = {
  id: number
  user?: number | { id: number } | null
}

const normalizeEmail = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const inferPersonName = (user: PayloadUser): string => {
  const fromName = user.name?.trim()
  if (fromName) return fromName

  const normalizedEmail = normalizeEmail(user.email)
  if (!normalizedEmail) return `User ${user.id}`

  const localPart = normalizedEmail.split('@')[0]
  return localPart || `User ${user.id}`
}

const findExistingPersonByUser = async (payload: Payload, userID: number): Promise<PayloadPerson | null> => {
  const people = await payload.find({
    collection: 'people',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: userID,
      },
    },
  })

  return (people.docs[0] as PayloadPerson | undefined) ?? null
}

const findUnlinkedPersonByEmail = async (
  payload: Payload,
  email: string,
): Promise<PayloadPerson | null> => {
  const people = await payload.find({
    collection: 'people',
    depth: 0,
    limit: 25,
    overrideAccess: true,
    pagination: false,
    sort: '-updatedAt',
    where: {
      email: {
        equals: email,
      },
    },
  })

  for (const doc of people.docs as PayloadPerson[]) {
    const linkedUserID = typeof doc.user === 'object' ? doc.user?.id : doc.user
    if (!linkedUserID) return doc
  }

  return null
}

export const backfillUsersToPeople = async (payload: Payload): Promise<void> => {
  let page = 1
  const currentYear = new Date().getUTCFullYear()

  while (true) {
    const usersPage = await payload.find({
      collection: 'users',
      depth: 0,
      limit: BATCH_SIZE,
      overrideAccess: true,
      page,
      sort: 'id',
    })

    for (const user of usersPage.docs as PayloadUser[]) {
      const existingPerson = await findExistingPersonByUser(payload, user.id)
      if (existingPerson) continue

      const normalizedEmail = normalizeEmail(user.email)
      const unlinkedPerson = normalizedEmail
        ? await findUnlinkedPersonByEmail(payload, normalizedEmail)
        : null

      if (unlinkedPerson) {
        await payload.update({
          collection: 'people',
          id: unlinkedPerson.id,
          data: {
            memberType: 'user',
            user: user.id,
          },
          depth: 0,
          overrideAccess: true,
        })
        continue
      }

      const personName = inferPersonName(user)
      const slugBase = toKebabCase(personName).replace(/[^a-z0-9-]/g, '') || 'user'

      await payload.create({
        collection: 'people',
        data: {
          name: personName,
          email: normalizedEmail ?? undefined,
          isVisible: true,
          joinedYear: currentYear,
          memberType: 'user',
          slug: `${slugBase}-${user.id}`,
          user: user.id,
        },
        depth: 0,
        draft: false,
        overrideAccess: true,
      })
    }

    if (!usersPage.hasNextPage) break
    page += 1
  }
}
