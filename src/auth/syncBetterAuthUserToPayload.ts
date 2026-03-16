import type { Payload } from 'payload'

import type { Person, User } from '@/payload-types'
import { toKebabCase } from '@/utilities/toKebabCase'

type BetterAuthUserShape = {
  email?: string | null
  id: number | string
  name?: string | null
}

type SyncArgs = {
  betterAuthUser: BetterAuthUserShape
  payload: Payload
}

const normalizeEmail = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const toPayloadUserID = (value: number | string): number | null => {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number.parseInt(value, 10)
  return null
}

const inferDisplayName = ({
  email,
  name,
}: {
  email?: string | null
  name?: string | null
}): string => {
  const fromName = name?.trim()
  if (fromName) return fromName

  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return 'New User'

  const localPart = normalizedEmail.split('@')[0]
  return localPart || 'New User'
}

const normalizeRole = (value: unknown): 'admin' | 'user' => {
  if (Array.isArray(value)) {
    return value.includes('admin') ? 'admin' : 'user'
  }

  return value === 'admin' ? 'admin' : 'user'
}

const findPayloadUserByID = async (payload: Payload, userID: number): Promise<User | null> => {
  const results = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      id: {
        equals: userID,
      },
    },
  })

  return results.docs[0] ?? null
}

const findPersonByUser = async (payload: Payload, userID: number): Promise<Person | null> => {
  const results = await payload.find({
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

  return results.docs[0] ?? null
}

const findPersonByEmail = async (payload: Payload, email: string): Promise<Person | null> => {
  const results = await payload.find({
    collection: 'people',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    sort: '-updatedAt',
    where: {
      email: {
        equals: email,
      },
    },
  })

  return results.docs[0] ?? null
}

export const syncBetterAuthUserToPayload = async ({
  betterAuthUser,
  payload,
}: SyncArgs): Promise<void> => {
  const payloadUserID = toPayloadUserID(betterAuthUser.id)
  if (!payloadUserID) return

  const payloadUser = await findPayloadUserByID(payload, payloadUserID)
  if (!payloadUser) return

  const normalizedEmail = normalizeEmail(payloadUser.email) ?? normalizeEmail(betterAuthUser.email)
  const normalizedName = inferDisplayName({
    email: normalizedEmail,
    name: payloadUser.name ?? betterAuthUser.name,
  })

  let person = await findPersonByUser(payload, payloadUser.id)

  if (!person && normalizedEmail) {
    person = await findPersonByEmail(payload, normalizedEmail)
  }

  if (!person) {
    await payload.create({
      collection: 'people',
      data: {
        email: normalizedEmail ?? undefined,
        isVisible: true,
        memberType: 'user',
        name: normalizedName,
        slug: `${toKebabCase(normalizedName) || 'user'}-${payloadUser.id}`,
        user: payloadUser.id,
        years: [new Date().getUTCFullYear()],
      },
      depth: 0,
      draft: false,
      overrideAccess: true,
    })

    return
  }

  const personPatch: Record<string, unknown> = {}
  const userPatch: Record<string, unknown> = {}
  const linkedUserID = typeof person.user === 'object' ? person.user?.id : person.user
  const resolvedRole = normalizeRole(payloadUser.role ?? payloadUser.roles)

  if (!linkedUserID) {
    personPatch.user = payloadUser.id
  }

  if (person.memberType == null) {
    personPatch.memberType = 'user'
  }

  if (payloadUser.role !== resolvedRole) {
    userPatch.role = resolvedRole
  }

  if (payloadUser.roles !== resolvedRole) {
    userPatch.roles = resolvedRole
  }

  if (person.isVisible === true && payloadUser.isApproved !== true) {
    userPatch.isApproved = true
  }

  if (Object.keys(personPatch).length > 0) {
    await payload.update({
      collection: 'people',
      id: person.id,
      data: personPatch,
      depth: 0,
      overrideAccess: true,
    })
  }

  if (Object.keys(userPatch).length > 0) {
    await payload.update({
      collection: 'users',
      id: payloadUser.id,
      data: userPatch,
      depth: 0,
      overrideAccess: true,
    })
  }
}
