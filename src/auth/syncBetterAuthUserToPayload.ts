import type { Payload } from 'payload'

import type { User } from '@/payload-types'
import { findProfileOnlyUserByContactEmail, mergeProfileOnlyUser } from './mergeProfileOnlyUser'

type BetterAuthUserShape = {
  email?: string | null
  emailVerified?: boolean | null
  id: number | string
  name?: string | null
}

type SyncArgs = {
  betterAuthUser: BetterAuthUserShape
  /** Which Better Auth database hook is calling: a fresh sign-up or a later update. */
  operation?: 'create' | 'update'
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

/**
 * Runs after Better Auth creates or updates a user. The user row *is* the member profile, so
 * this fills in profile defaults and applies the membership rule:
 *
 * - When the account has verified its email and an admin had already listed a member with that
 *   address (a profile-only user, no login), the two records are merged: the account takes over
 *   the profile, its slug and its posts, and is approved. Nothing happens before verification,
 *   so signing up with someone else's address grants nothing.
 * - Listed, visible members are approved as soon as they are verified; everyone else needs an
 *   admin approval.
 */
export const syncBetterAuthUserToPayload = async ({
  betterAuthUser,
  operation = 'update',
  payload,
}: SyncArgs): Promise<void> => {
  const payloadUserID = toPayloadUserID(betterAuthUser.id)
  if (!payloadUserID) return

  let payloadUser = await findPayloadUserByID(payload, payloadUserID)
  if (!payloadUser) return

  const normalizedEmail = normalizeEmail(payloadUser.email) ?? normalizeEmail(betterAuthUser.email)
  const emailVerified = betterAuthUser.emailVerified ?? payloadUser.emailVerified
  const userPatch: Record<string, unknown> = {}
  let merged = false

  if (normalizedEmail && emailVerified === true) {
    const listedMember = await findProfileOnlyUserByContactEmail({
      email: normalizedEmail,
      excludeUserID: payloadUser.id,
      payload,
    })

    if (listedMember) {
      await mergeProfileOnlyUser({ from: listedMember, into: payloadUser, payload })
      payloadUser = (await findPayloadUserByID(payload, payloadUserID)) ?? payloadUser
      merged = true
    }
  }

  // A self-registered account stays out of the public directory until an admin approves it
  // (approval reveals it, see `revealOnApproval`); a merged or admin-listed profile keeps its
  // own visibility.
  if (operation === 'create' && !merged && payloadUser.isVisible !== false) {
    userPatch.isVisible = false
  }

  const resolvedRole = normalizeRole(payloadUser.role ?? payloadUser.roles)

  if (!payloadUser.name?.trim()) {
    userPatch.name = inferDisplayName({ email: normalizedEmail, name: betterAuthUser.name })
  }

  if (payloadUser.memberType == null) {
    userPatch.memberType = 'user'
  }

  if (!Array.isArray(payloadUser.years) || payloadUser.years.length === 0) {
    userPatch.years = [new Date().getUTCFullYear()]
  }

  if (payloadUser.role !== resolvedRole) {
    userPatch.role = resolvedRole
  }

  if (payloadUser.roles !== resolvedRole) {
    userPatch.roles = resolvedRole
  }

  const isListedMember =
    userPatch.isVisible !== false &&
    payloadUser.isVisible === true &&
    payloadUser.memberType !== 'alumni'

  if (isListedMember && emailVerified === true && payloadUser.isApproved !== true) {
    userPatch.isApproved = true
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
