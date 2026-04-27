import type { AuthStrategy, Payload } from 'payload'

import type { User } from '@/payload-types'

type BetterAuthStrategyOptions = {
  idType?: 'number' | 'text'
  usersCollection?: 'users' | string
}

type BetterAuthSessionUser = {
  email?: string | null
  id?: number | string | null
}

type BetterAuthSession = {
  session?: Record<string, unknown> | null
  user?: BetterAuthSessionUser | null
}

type BetterAuthAPI = {
  getSession?: (args: { headers: Headers }) => Promise<BetterAuthSession | null>
}

type PayloadWithBetterAuth = Payload & {
  betterAuth?: {
    api?: BetterAuthAPI
  }
}

const normalizeEmail = (value: string | null | undefined): string | null => {
  const normalized = value?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const coerceNumericID = (value: number | string | null | undefined): number | null => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10)
  }
  return null
}

const coerceSessionFields = (
  value: Record<string, unknown> | null | undefined,
  idType: 'number' | 'text',
): Record<string, unknown> => {
  if (!value) return {}

  const result = { ...value }
  if (idType !== 'number') return result

  for (const [key, entry] of Object.entries(result)) {
    if (typeof entry !== 'string') continue
    if (key === 'id' || /(?:Id|_id)$/.test(key)) {
      const coerced = coerceNumericID(entry)
      if (coerced !== null) {
        result[key] = coerced
      }
    }
  }

  return result
}

const findPayloadUser = async ({
  betterAuthUser,
  idType,
  payload,
  usersCollection,
}: {
  betterAuthUser: BetterAuthSessionUser
  idType: 'number' | 'text'
  payload: Payload
  usersCollection: string
}): Promise<User | null> => {
  const resolvedID =
    idType === 'number'
      ? coerceNumericID(betterAuthUser.id)
      : typeof betterAuthUser.id === 'string' || typeof betterAuthUser.id === 'number'
        ? betterAuthUser.id
        : null

  const matchers: Array<Record<string, unknown>> = []

  if (resolvedID != null) {
    matchers.push({
      id: {
        equals: resolvedID,
      },
    })
  }

  if (typeof betterAuthUser.id === 'string' && betterAuthUser.id.length > 0) {
    matchers.push({
      betterAuthUserId: {
        equals: betterAuthUser.id,
      },
    })
  }

  const normalizedEmail = normalizeEmail(betterAuthUser.email)
  if (normalizedEmail) {
    matchers.push({
      email: {
        equals: normalizedEmail,
      },
    })
  }

  for (const where of matchers) {
    const users = await payload.find({
      collection: usersCollection as never,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: where as never,
    })

    const user = users.docs[0]
    if (user) return user as User
  }

  return null
}

export const payloadBetterAuthStrategy = ({
  idType = 'number',
  usersCollection = 'users',
}: BetterAuthStrategyOptions = {}): AuthStrategy => {
  return {
    name: 'better-auth',
    authenticate: async ({ headers, payload }: { headers: Headers; payload: Payload }) => {
      const auth = (payload as PayloadWithBetterAuth).betterAuth

      if (!auth?.api?.getSession) {
        payload.logger.error('[auth] Better Auth strategy missing initialized auth instance.')
        return { user: null }
      }

      try {
        const sessionData = (await auth.api.getSession({
          headers,
        })) as BetterAuthSession | null

        if (!sessionData?.user?.id) {
          payload.logger.warn('[auth] Better Auth strategy received no active session user.')
          return { user: null }
        }

        const payloadUser = await findPayloadUser({
          betterAuthUser: sessionData.user,
          idType,
          payload,
          usersCollection,
        })

        if (!payloadUser) {
          payload.logger.warn(
            `[auth] Better Auth strategy could not resolve payload user for session user ${String(sessionData.user.id)}.`,
          )
          return { user: null }
        }

        const {
          expiresAt: _expiresAt,
          id: _sessionID,
          token: _token,
          userId: _userID,
          ...sessionFields
        } = sessionData.session || {}

        return {
          user: {
            ...payloadUser,
            ...coerceSessionFields(sessionFields, idType),
            collection: usersCollection,
            _strategy: 'better-auth',
          } as User,
        }
      } catch (error) {
        payload.logger.error(
          `[auth] Better Auth strategy error: ${error instanceof Error ? error.message : String(error)}`,
        )
        return { user: null }
      }
    },
  }
}
