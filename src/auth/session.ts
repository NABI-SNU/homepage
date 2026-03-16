import type { Payload } from 'payload'

import type { PayloadWithAuth } from '@delmaredigital/payload-better-auth'
import type { User } from '@/payload-types'

type HeaderRecord = Record<string, string | string[] | undefined>

type DefaultSessionUser = {
  email?: string | null
  emailVerified?: boolean
  id?: number | string
  [key: string]: unknown
}

export type Session<TUser = DefaultSessionUser> = {
  session: {
    expiresAt?: Date | string
    id?: number | string
    [key: string]: unknown
  }
  user: TUser
}

type SessionLookupFailureReason =
  | 'auth_not_initialized'
  | 'missing_session_user'
  | 'session_lookup_failed'

const toHeaders = (headers: Headers | HeaderRecord): Headers => {
  return new Headers(headers as HeadersInit)
}

const logSessionLookup = ({
  details,
  level,
  message,
  payload,
}: {
  details?: Record<string, unknown>
  level: 'error' | 'info' | 'warn'
  message: string
  payload: Payload
}) => {
  const serialized = details ? `${message} ${JSON.stringify(details)}` : message
  payload.logger[level](serialized)
}

const coerceIDs = <T>(value: T): T => {
  if (!value || typeof value !== 'object') return value

  const result = { ...(value as Record<string, unknown>) }
  for (const [key, entry] of Object.entries(result)) {
    if (typeof entry !== 'string') continue
    if (key === 'id' || /(?:Id|_id)$/.test(key)) {
      if (/^\d+$/.test(entry)) {
        result[key] = Number.parseInt(entry, 10)
      }
    }
  }

  return result as T
}

const readBetterAuthSession = async <TUser = User>(
  payload: Payload,
  headers: Headers | HeaderRecord,
): Promise<Session<TUser> | null> => {
  const payloadWithAuth = payload as PayloadWithAuth
  const auth = payloadWithAuth.betterAuth

  if (!auth) {
    logSessionLookup({
      level: 'error',
      message: '[auth] Better Auth session lookup failed.',
      payload,
      details: {
        reason: 'auth_not_initialized' satisfies SessionLookupFailureReason,
      },
    })
    return null
  }

  try {
    const session = (await auth.api.getSession({
      headers: toHeaders(headers),
    })) as Session<TUser> | null

    const sessionUser =
      session?.user && typeof session.user === 'object'
        ? (session.user as { id?: number | string })
        : null

    if (!sessionUser?.id) {
      logSessionLookup({
        level: 'warn',
        message: '[auth] Better Auth session lookup returned no active user.',
        payload,
        details: {
          reason: 'missing_session_user' satisfies SessionLookupFailureReason,
        },
      })
      return null
    }

    const resolvedSession = session as Session<TUser>

    return {
      session: coerceIDs(resolvedSession.session),
      user: coerceIDs(resolvedSession.user),
    }
  } catch (error) {
    logSessionLookup({
      level: 'error',
      message: '[auth] Better Auth session lookup failed.',
      payload,
      details: {
        error: error instanceof Error ? error.message : String(error),
        reason: 'session_lookup_failed' satisfies SessionLookupFailureReason,
      },
    })
    return null
  }
}

export async function getServerSession<TUser = User>(
  payload: Payload,
  headers: Headers | HeaderRecord,
): Promise<Session<TUser> | null> {
  return readBetterAuthSession<TUser>(payload, headers)
}

export async function getServerUser<TUser = User>(
  payload: Payload,
  headers: Headers | HeaderRecord,
): Promise<TUser | null> {
  const session = await getServerSession<TUser>(payload, headers)
  return session?.user ?? null
}

export function createSessionHelpers<TUser = User>() {
  return {
    getServerSession: (payload: Payload, headers: Headers | HeaderRecord) =>
      getServerSession<TUser>(payload, headers),
    getServerUser: (payload: Payload, headers: Headers | HeaderRecord) =>
      getServerUser<TUser>(payload, headers),
  }
}
