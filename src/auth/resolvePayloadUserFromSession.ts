import type { Payload } from 'payload'

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

const isProduction = process.env.NODE_ENV === 'production'

const normalizeEmail = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
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
      return null
    }
  }

  let payloadUser = users.docs[0]
  if (!payloadUser) return null

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
    return null
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
      return null
    }
  }

  return payloadUser
}
