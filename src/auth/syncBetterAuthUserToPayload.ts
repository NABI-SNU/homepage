import type { Payload } from 'payload'
import { Pool } from 'pg'

import type { Person, User } from '@/payload-types'
import { toKebabCase } from '@/utilities/toKebabCase'

type BetterAuthUserShape = {
  id: string
  email?: string | null
  name?: string | null
}

type SyncArgs = {
  betterAuthUser?: BetterAuthUserShape | null
  betterAuthUserId?: string
}

let betterAuthPool: Pool | null = null
let payloadPromise: Promise<Payload> | null = null

const getPool = (): Pool | null => {
  if (!process.env.DATABASE_URL) return null
  if (!betterAuthPool) {
    betterAuthPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  return betterAuthPool
}

const getPayloadInstance = async (): Promise<Payload> => {
  if (!payloadPromise) {
    payloadPromise = (async () => {
      const [{ getPayload }, configModule] = await Promise.all([import('payload'), import('@payload-config')])
      return getPayload({ config: configModule.default })
    })()
  }

  return payloadPromise
}

const normalizeEmail = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const normalizeName = (name: string | null | undefined): string | null => {
  const normalized = name?.trim().replace(/\s+/g, ' ').toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const inferDisplayName = (user: BetterAuthUserShape): string => {
  const fromName = user.name?.trim()
  if (fromName) return fromName

  const normalizedEmail = normalizeEmail(user.email)
  if (!normalizedEmail) return 'New User'

  const localPart = normalizedEmail.split('@')[0]
  return localPart || 'New User'
}

const getBetterAuthUserById = async (id: string): Promise<BetterAuthUserShape | null> => {
  const pool = getPool()
  if (!pool) return null

  try {
    const result = await pool.query<{
      id: string
      email: string | null
      name: string | null
    }>('SELECT "id", "email", "name" FROM "user" WHERE "id" = $1 LIMIT 1', [id])

    const row = result.rows[0]
    if (!row) return null

    return {
      id: row.id,
      email: row.email,
      name: row.name,
    }
  } catch (error) {
    console.error('[auth-sync] Failed loading BetterAuth user by id', error)
    return null
  }
}

const findPayloadUserByBetterAuthId = async (
  payload: Payload,
  betterAuthUserId: string,
): Promise<User | null> => {
  const results = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      betterAuthUserId: {
        equals: betterAuthUserId,
      },
    },
  })

  return results.docs[0] ?? null
}

const findPayloadUserByEmail = async (
  payload: Payload,
  email: string,
): Promise<{ user: User | null; duplicateEmail: boolean }> => {
  const results = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: email,
      },
    },
  })

  if (results.docs.length > 1) {
    return { user: null, duplicateEmail: true }
  }

  return { user: results.docs[0] ?? null, duplicateEmail: false }
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

const findPersonByName = async (payload: Payload, name: string): Promise<Person | null> => {
  const normalizedName = normalizeName(name)
  if (!normalizedName) return null

  const results = await payload.find({
    collection: 'people',
    depth: 0,
    limit: 25,
    overrideAccess: true,
    pagination: false,
    sort: '-updatedAt',
    where: {
      name: {
        like: name,
      },
    },
  })

  const exactMatch = results.docs.find((doc) => normalizeName(doc.name) === normalizedName)
  return exactMatch ?? results.docs[0] ?? null
}

export const syncBetterAuthUserToPayload = async ({
  betterAuthUser,
  betterAuthUserId,
}: SyncArgs): Promise<void> => {
  const payload = await getPayloadInstance()

  const resolvedBetterAuthUser =
    betterAuthUser ?? (betterAuthUserId ? await getBetterAuthUserById(betterAuthUserId) : null)

  if (!resolvedBetterAuthUser) return

  const normalizedEmail = normalizeEmail(resolvedBetterAuthUser.email)
  const betterAuthID = resolvedBetterAuthUser.id

  let payloadUser = await findPayloadUserByBetterAuthId(payload, betterAuthID)

  if (!payloadUser && normalizedEmail) {
    const lookup = await findPayloadUserByEmail(payload, normalizedEmail)
    if (lookup.duplicateEmail) {
      console.error('[auth-sync] Duplicate payload users found for email', normalizedEmail)
      return
    }

    payloadUser = lookup.user
  }

  const normalizedName = inferDisplayName(resolvedBetterAuthUser)

  if (!payloadUser && !normalizedEmail) return

  if (!payloadUser) {
    const emailForUser = normalizedEmail
    if (!emailForUser) return

    payloadUser = await payload.create({
      collection: 'users',
      data: {
        betterAuthUserId: betterAuthID,
        email: emailForUser,
        name: normalizedName,
        isApproved: false,
        roles: 'user',
      },
      depth: 0,
      draft: false,
      overrideAccess: true,
    })
  } else {
    const userPatch: Record<string, unknown> = {}

    if (payloadUser.betterAuthUserId !== betterAuthID) {
      userPatch.betterAuthUserId = betterAuthID
    }

    if (normalizedEmail && payloadUser.email !== normalizedEmail) {
      const lookup = await findPayloadUserByEmail(payload, normalizedEmail)
      if (lookup.duplicateEmail || (lookup.user && lookup.user.id !== payloadUser.id)) {
        console.error('[auth-sync] Refusing email update due to duplicate payload user email', normalizedEmail)
        return
      }

      userPatch.email = normalizedEmail
    }

    if (!payloadUser.name && normalizedName) {
      userPatch.name = normalizedName
    }

    if (Object.keys(userPatch).length > 0) {
      payloadUser = await payload.update({
        collection: 'users',
        id: payloadUser.id,
        data: userPatch,
        depth: 0,
        overrideAccess: true,
      })
    }
  }

  let person = await findPersonByUser(payload, payloadUser.id)

  if (!person && normalizedEmail) {
    person = await findPersonByEmail(payload, normalizedEmail)
  }

  if (!person && normalizedName) {
    person = await findPersonByName(payload, normalizedName)
  }

  if (!person) {
    const slugBase = toKebabCase(normalizedName) || 'user'

    await payload.create({
      collection: 'people',
      data: {
        name: normalizedName,
        email: normalizedEmail ?? undefined,
        slug: `${slugBase}-${payloadUser.id}`,
        joinedYear: new Date().getUTCFullYear(),
        isVisible: true,
        memberType: 'user',
        user: payloadUser.id,
      },
      depth: 0,
      draft: false,
      overrideAccess: true,
    })

    return
  }

  const personPatch: Record<string, unknown> = {}

  const linkedUserID = typeof person.user === 'object' ? person.user?.id : person.user

  if (!linkedUserID) {
    personPatch.user = payloadUser.id
  }

  if (person.memberType == null) {
    personPatch.memberType = 'user'
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
}
