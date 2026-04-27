import type { Payload } from 'payload'

import type { AuthGateReason } from './authGateReason'
import { isProductionBlockedAuthEmail } from './productionBlockedAuth'
import type { User } from '@/payload-types'

export type BetterAuthSessionUser = {
  email?: string | null
  emailVerified?: boolean
  id?: string
}

type ResolvePayloadUserFromSessionArgs = {
  payload: Payload
  betterAuthUser: BetterAuthSessionUser | null | undefined
  requireApproval?: boolean
  autoApproveByPeopleEmail?: boolean
  enforceProductionEmailVerification?: boolean
  denyAlumni?: boolean
}

export type PayloadUserResolutionWithReason = {
  reason: AuthGateReason
  user: User | null
}

type PersonVisibilityDoc = {
  id: number
  isVisible?: boolean | null
  memberType?: 'alumni' | 'user' | null
  user?: number | { id: number } | null
}

const isProduction = (): boolean => process.env.NODE_ENV === 'production'

const normalizeEmail = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const toPayloadUserID = (value: string | number | undefined): number | null => {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number.parseInt(value, 10)
  return null
}

const findPayloadUserByID = async ({
  payload,
  userID,
}: {
  payload: Payload
  userID: number
}): Promise<User | null> => {
  const users = await payload.find({
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

  return users.docs[0] ?? null
}

const findLinkedPerson = async ({
  payload,
  userID,
}: {
  payload: Payload
  userID: number
}): Promise<PersonVisibilityDoc | null> => {
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

  return (people.docs[0] as PersonVisibilityDoc | undefined) ?? null
}

export const resolvePayloadUserByIdentity = async ({
  betterAuthUser,
  payload,
}: {
  betterAuthUser: BetterAuthSessionUser | null | undefined
  payload: Payload
}): Promise<User | null> => {
  const payloadUserID = toPayloadUserID(betterAuthUser?.id)
  if (!payloadUserID) return null

  try {
    return await findPayloadUserByID({ payload, userID: payloadUserID })
  } catch (error) {
    payload.logger.error(
      `[auth] Failed resolving payload user identity: ${error instanceof Error ? error.message : String(error)}`,
    )
    return null
  }
}

export const resolvePayloadUserFromSessionWithReason = async ({
  payload,
  betterAuthUser,
  requireApproval = true,
  autoApproveByPeopleEmail = false,
  enforceProductionEmailVerification = true,
  denyAlumni = false,
}: ResolvePayloadUserFromSessionArgs): Promise<PayloadUserResolutionWithReason> => {
  void autoApproveByPeopleEmail

  const payloadUserID = toPayloadUserID(betterAuthUser?.id)

  if (!payloadUserID) {
    return { user: null, reason: 'account_not_found' }
  }

  const requestedEmail = normalizeEmail(betterAuthUser?.email)
  if (requestedEmail && isProductionBlockedAuthEmail(requestedEmail)) {
    return { user: null, reason: 'invalid_credentials' }
  }

  try {
    const payloadUser = await findPayloadUserByID({
      payload,
      userID: payloadUserID,
    })

    if (!payloadUser) {
      return { user: null, reason: 'account_not_found' }
    }

    const normalizedEmail =
      normalizeEmail(betterAuthUser?.email) ?? normalizeEmail(payloadUser.email)

    if (normalizedEmail && isProductionBlockedAuthEmail(normalizedEmail)) {
      return { user: null, reason: 'invalid_credentials' }
    }

    const emailVerified = betterAuthUser?.emailVerified ?? payloadUser.emailVerified
    if (isProduction() && enforceProductionEmailVerification && emailVerified !== true) {
      return { user: null, reason: 'email_not_verified' }
    }

    const linkedPerson = await findLinkedPerson({
      payload,
      userID: payloadUser.id,
    })

    if (isProduction() && linkedPerson?.isVisible === false) {
      return { user: null, reason: 'invalid_credentials' }
    }

    if (requireApproval && payloadUser.isApproved !== true) {
      return { user: null, reason: 'admin_approval_required' }
    }

    if (denyAlumni && linkedPerson?.memberType === 'alumni') {
      return { user: null, reason: 'unknown' }
    }

    return { user: payloadUser, reason: 'allowed' }
  } catch (error) {
    payload.logger.error(
      `[auth] Failed resolving payload user from BetterAuth session with reason: ${error instanceof Error ? error.message : String(error)}`,
    )
    return { user: null, reason: 'unknown' }
  }
}

export const resolvePayloadUserFromSession = async (
  args: ResolvePayloadUserFromSessionArgs,
): Promise<User | null> => {
  const resolved = await resolvePayloadUserFromSessionWithReason(args)
  return resolved.user
}
