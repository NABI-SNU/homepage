import type { Payload } from 'payload'

import type { AuthGateReason } from './authGateReason'
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

const isProduction = process.env.NODE_ENV === 'production'
const AUTH_RESOLUTION_CACHE_TTL_MS = 60_000

type AuthResolutionCacheEntry = {
  expiresAt: number
  user: User | null
}

type AuthResolutionResult = {
  cacheable: boolean
  user: User | null
}

const authResolutionCache = new Map<string, AuthResolutionCacheEntry>()
const inFlightAuthResolutions = new Map<string, Promise<AuthResolutionResult>>()

const buildAuthResolutionCacheKey = ({
  autoApproveByPeopleEmail,
  betterAuthUser,
  denyAlumni,
  email,
  enforceProductionEmailVerification,
  requireApproval,
}: {
  autoApproveByPeopleEmail: boolean
  betterAuthUser: BetterAuthSessionUser
  denyAlumni: boolean
  email: string
  enforceProductionEmailVerification: boolean
  requireApproval: boolean
}): string => {
  return [
    betterAuthUser.id,
    email,
    requireApproval ? 'req-approval' : 'skip-approval',
    autoApproveByPeopleEmail ? 'auto-approve' : 'no-auto-approve',
    enforceProductionEmailVerification ? 'verify-email' : 'skip-email-verify',
    denyAlumni ? 'deny-alumni' : 'allow-alumni',
    betterAuthUser.emailVerified ? 'email-verified' : 'email-unverified',
  ].join('|')
}

const readAuthResolutionCache = (key: string): User | null | undefined => {
  const entry = authResolutionCache.get(key)
  if (!entry) return undefined

  if (entry.expiresAt <= Date.now()) {
    authResolutionCache.delete(key)
    return undefined
  }

  return entry.user
}

const writeAuthResolutionCache = (key: string, user: User | null): void => {
  authResolutionCache.set(key, {
    expiresAt: Date.now() + AUTH_RESOLUTION_CACHE_TTL_MS,
    user,
  })
}

const authDebugLogsEnabled = (): boolean =>
  ['1', 'true', 'yes', 'on'].includes((process.env.AUTH_DEBUG_LOGS || '').toLowerCase())

const normalizeEmail = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

export const resolvePayloadUserFromSessionWithReason = async ({
  payload,
  betterAuthUser,
  requireApproval = true,
  autoApproveByPeopleEmail = true,
  enforceProductionEmailVerification = true,
  denyAlumni = false,
}: ResolvePayloadUserFromSessionArgs): Promise<PayloadUserResolutionWithReason> => {
  if (!betterAuthUser?.id) {
    return { user: null, reason: 'account_not_found' }
  }

  const normalizedEmail = normalizeEmail(betterAuthUser.email)
  if (!normalizedEmail) {
    return { user: null, reason: 'account_not_found' }
  }

  if (isProduction && enforceProductionEmailVerification && betterAuthUser.emailVerified !== true) {
    return { user: null, reason: 'email_not_verified' }
  }

  try {
    let users = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        betterAuthUserId: {
          equals: betterAuthUser.id,
        },
      },
    })

    if (users.docs.length === 0) {
      users = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 2,
        overrideAccess: true,
        pagination: false,
        where: {
          email: {
            equals: normalizedEmail,
          },
        },
      })

      if (users.docs.length > 1) {
        payload.logger.error(`[auth] Duplicate payload users found for email ${normalizedEmail}`)
        return { user: null, reason: 'unknown' }
      }
    }

    let payloadUser = users.docs[0]
    if (!payloadUser) return { user: null, reason: 'account_not_found' }

    if (payloadUser.betterAuthUserId !== betterAuthUser.id) {
      payloadUser = await payload.update({
        collection: 'users',
        id: payloadUser.id,
        data: {
          betterAuthUserId: betterAuthUser.id,
        },
        depth: 0,
        overrideAccess: true,
      })
    }

    if (requireApproval && payloadUser.isApproved !== true && autoApproveByPeopleEmail) {
      const people = await payload.find({
        collection: 'people',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          email: {
            equals: normalizedEmail,
          },
        },
      })

      const matchingPerson = people.docs[0]

      if (matchingPerson) {
        payloadUser = await payload.update({
          collection: 'users',
          id: payloadUser.id,
          data: {
            isApproved: true,
          },
          depth: 0,
          overrideAccess: true,
        })

        const linkedUserID =
          typeof matchingPerson.user === 'object' ? matchingPerson.user?.id : matchingPerson.user

        if (!linkedUserID) {
          await payload.update({
            collection: 'people',
            id: matchingPerson.id,
            data: {
              user: payloadUser.id,
            },
            depth: 0,
            overrideAccess: true,
          })
        }
      }
    }

    if (requireApproval && payloadUser.isApproved !== true) {
      return { user: null, reason: 'admin_approval_required' }
    }

    if (denyAlumni) {
      const alumniCheck = await payload.find({
        collection: 'people',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            {
              user: {
                equals: payloadUser.id,
              },
            },
            {
              memberType: {
                equals: 'alumni',
              },
            },
          ],
        },
      })

      if (alumniCheck.docs.length > 0) {
        return { user: null, reason: 'unknown' }
      }
    }

    return { user: payloadUser, reason: 'allowed' }
  } catch (error) {
    payload.logger.error(
      `[auth] Failed resolving payload user from BetterAuth session with reason: ${error instanceof Error ? error.message : String(error)}`,
    )
    return { user: null, reason: 'unknown' }
  }
}

export const resolvePayloadUserFromSession = async ({
  payload,
  betterAuthUser,
  requireApproval = true,
  autoApproveByPeopleEmail = true,
  enforceProductionEmailVerification = true,
  denyAlumni = false,
}: ResolvePayloadUserFromSessionArgs): Promise<User | null> => {
  if (!betterAuthUser?.id) return null

  const normalizedEmail = normalizeEmail(betterAuthUser.email)
  if (!normalizedEmail) return null

  if (isProduction && enforceProductionEmailVerification && betterAuthUser.emailVerified !== true) {
    return null
  }

  const cacheKey = buildAuthResolutionCacheKey({
    autoApproveByPeopleEmail,
    betterAuthUser,
    denyAlumni,
    email: normalizedEmail,
    enforceProductionEmailVerification,
    requireApproval,
  })

  const cachedUser = readAuthResolutionCache(cacheKey)
  if (cachedUser !== undefined) {
    return cachedUser
  }

  const inFlight = inFlightAuthResolutions.get(cacheKey)
  if (inFlight) {
    const inFlightResult = await inFlight
    return inFlightResult.user
  }

  const resolutionPromise = (async (): Promise<AuthResolutionResult> => {
    let users = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        betterAuthUserId: {
          equals: betterAuthUser.id,
        },
      },
    })

    if (users.docs.length === 0) {
      users = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 2,
        overrideAccess: true,
        pagination: false,
        where: {
          email: {
            equals: normalizedEmail,
          },
        },
      })

      if (users.docs.length > 1) {
        payload.logger.error(`[auth] Duplicate payload users found for email ${normalizedEmail}`)
        return { user: null, cacheable: true }
      }
    }

    let payloadUser = users.docs[0]
    if (!payloadUser) return { user: null, cacheable: true }

    if (payloadUser.betterAuthUserId !== betterAuthUser.id) {
      payloadUser = await payload.update({
        collection: 'users',
        id: payloadUser.id,
        data: {
          betterAuthUserId: betterAuthUser.id,
        },
        depth: 0,
        overrideAccess: true,
      })
    }

    if (requireApproval && payloadUser.isApproved !== true && autoApproveByPeopleEmail) {
      const people = await payload.find({
        collection: 'people',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          email: {
            equals: normalizedEmail,
          },
        },
      })

      const matchingPerson = people.docs[0]

      if (matchingPerson) {
        payloadUser = await payload.update({
          collection: 'users',
          id: payloadUser.id,
          data: {
            isApproved: true,
          },
          depth: 0,
          overrideAccess: true,
        })

        const linkedUserID =
          typeof matchingPerson.user === 'object' ? matchingPerson.user?.id : matchingPerson.user

        if (!linkedUserID) {
          await payload.update({
            collection: 'people',
            id: matchingPerson.id,
            data: {
              user: payloadUser.id,
            },
            depth: 0,
            overrideAccess: true,
          })
        }
      }
    }

    if (requireApproval && payloadUser.isApproved !== true) {
      return { user: null, cacheable: true }
    }

    if (denyAlumni) {
      const alumniCheck = await payload.find({
        collection: 'people',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            {
              user: {
                equals: payloadUser.id,
              },
            },
            {
              memberType: {
                equals: 'alumni',
              },
            },
          ],
        },
      })

      if (alumniCheck.docs.length > 0) {
        return { user: null, cacheable: true }
      }
    }

    return { user: payloadUser, cacheable: true }
  })()

  inFlightAuthResolutions.set(cacheKey, resolutionPromise)

  try {
    const resolved = await resolutionPromise
    if (resolved.cacheable) {
      writeAuthResolutionCache(cacheKey, resolved.user)
    } else if (authDebugLogsEnabled()) {
      payload.logger.info(`[auth] Skipped auth resolution cache for key ${cacheKey}.`)
    }

    return resolved.user
  } catch (error) {
    payload.logger.error(
      `[auth] Failed resolving payload user from BetterAuth session: ${error instanceof Error ? error.message : String(error)}`,
    )
    return null
  } finally {
    inFlightAuthResolutions.delete(cacheKey)
  }
}
