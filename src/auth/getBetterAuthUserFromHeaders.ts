import { auth } from './betterAuth'

import type { BetterAuthSessionUser } from './resolvePayloadUserFromSession'

type HeaderRecord = Record<string, string | string[] | undefined>
const isProduction = process.env.NODE_ENV === 'production'
const authBaseURLFromEnv = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || null
const BETTER_AUTH_SESSION_CACHE_TTL_MS = Number.parseInt(
  process.env.AUTH_SESSION_CACHE_TTL_MS || '60000',
  10,
)

export type BetterAuthLookupFailureReason =
  | 'session_handler_error'
  | 'session_response_not_ok'
  | 'session_json_invalid'
  | 'missing_session_user'

export type BetterAuthLookupResult = {
  betterAuthUser: BetterAuthSessionUser | null
  responseHeaders: Headers
  failureReason: BetterAuthLookupFailureReason | null
  statusCode: number | null
}

type BetterAuthSessionCacheEntry = {
  expiresAt: number
  result: BetterAuthLookupResult
}

const betterAuthSessionCache = new Map<string, BetterAuthSessionCacheEntry>()
const betterAuthSessionInFlight = new Map<string, Promise<BetterAuthLookupResult>>()

const getHeaderValue = (headers: Headers | HeaderRecord, name: string): string | null => {
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name)
  }

  const record = headers as HeaderRecord
  const lower = name.toLowerCase()
  const rawValue = record[lower] ?? record[name]
  if (Array.isArray(rawValue)) return rawValue[0] ?? null
  return typeof rawValue === 'string' ? rawValue : null
}

const getSessionCacheKey = (headers: Headers | HeaderRecord): string | null => {
  const cookieHeader = getHeaderValue(headers, 'cookie')?.trim()
  if (!cookieHeader) return null

  const authCookie = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find(
      (entry) =>
        entry.startsWith('__Secure-better-auth.session_token=') ||
        entry.startsWith('better-auth.session_token='),
    )

  if (!authCookie) return null

  return authCookie
}

const readSessionCache = (cacheKey: string): BetterAuthLookupResult | null => {
  const cached = betterAuthSessionCache.get(cacheKey)
  if (!cached) return null

  if (cached.expiresAt <= Date.now()) {
    betterAuthSessionCache.delete(cacheKey)
    return null
  }

  return {
    ...cached.result,
    // Avoid replaying stale cookies; only fresh lookups should propagate set-cookie.
    responseHeaders: new Headers(),
  }
}

const writeSessionCache = (cacheKey: string, result: BetterAuthLookupResult): void => {
  if (BETTER_AUTH_SESSION_CACHE_TTL_MS <= 0) return

  // Cache only successful or expected null-session outcomes.
  const cacheable =
    result.failureReason === null ||
    result.failureReason === 'missing_session_user' ||
    result.failureReason === 'session_response_not_ok'

  if (!cacheable) return

  betterAuthSessionCache.set(cacheKey, {
    expiresAt: Date.now() + BETTER_AUTH_SESSION_CACHE_TTL_MS,
    result: {
      ...result,
      responseHeaders: new Headers(),
    },
  })
}

const resolveBaseURLFromHeaders = (headers: Headers | HeaderRecord): string => {
  if (isProduction && authBaseURLFromEnv) {
    return authBaseURLFromEnv
  }

  const forwardedProto = getHeaderValue(headers, 'x-forwarded-proto')?.split(',')[0]?.trim()
  const forwardedHost = getHeaderValue(headers, 'x-forwarded-host')?.split(',')[0]?.trim()

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  const host = getHeaderValue(headers, 'host')?.trim()
  if (host) {
    const protocol = host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https'
    return `${protocol}://${host}`
  }

  if (!isProduction) {
    return 'http://localhost:3000'
  }

  return authBaseURLFromEnv || 'http://localhost:3000'
}

const toBetterAuthHeaders = (headers: Headers | HeaderRecord): Headers => {
  const normalized = new Headers(headers as HeadersInit)
  const forwarded = new Headers()
  const passthroughHeaders = [
    'cookie',
    'host',
    'origin',
    'referer',
    'user-agent',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-forwarded-for',
  ] as const

  for (const headerName of passthroughHeaders) {
    const value = normalized.get(headerName)
    if (value) forwarded.set(headerName, value)
  }

  return forwarded
}

const extractResponseHeaders = (response: Response): Headers => {
  const responseHeaders = new Headers()
  const headerContainer = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const setCookies =
    typeof headerContainer.getSetCookie === 'function'
      ? headerContainer.getSetCookie()
      : response.headers.get('set-cookie')
        ? [response.headers.get('set-cookie') as string]
        : []

  for (const cookieValue of setCookies) {
    responseHeaders.append('set-cookie', cookieValue)
  }

  return responseHeaders
}

export const getBetterAuthUserFromHeaders = async (
  headers: Headers | HeaderRecord,
): Promise<BetterAuthLookupResult> => {
  const cacheKey = getSessionCacheKey(headers)
  if (cacheKey) {
    const cachedResult = readSessionCache(cacheKey)
    if (cachedResult) return cachedResult
  }

  const inFlight = cacheKey ? betterAuthSessionInFlight.get(cacheKey) : null
  if (inFlight) return inFlight

  const lookupPromise = (async (): Promise<BetterAuthLookupResult> => {
  const baseURL = resolveBaseURLFromHeaders(headers)
  const sessionRequest = new Request(`${baseURL}/api/auth/get-session`, {
    method: 'GET',
    headers: toBetterAuthHeaders(headers),
  })

  let sessionResponse: Response
  try {
    sessionResponse = await auth.handler(sessionRequest)
  } catch {
    const result: BetterAuthLookupResult = {
      betterAuthUser: null,
      responseHeaders: new Headers(),
      failureReason: 'session_handler_error',
      statusCode: null,
    }
    return result
  }

  const responseHeaders = extractResponseHeaders(sessionResponse)

  if (!sessionResponse.ok) {
    const result: BetterAuthLookupResult = {
      betterAuthUser: null,
      responseHeaders,
      failureReason: 'session_response_not_ok',
      statusCode: sessionResponse.status,
    }
    if (cacheKey) writeSessionCache(cacheKey, result)
    return result
  }

  const session = (await sessionResponse.json().catch(() => undefined)) as
    | {
        user?: BetterAuthSessionUser | null
      }
    | undefined

  if (session === undefined) {
    const result: BetterAuthLookupResult = {
      betterAuthUser: null,
      responseHeaders,
      failureReason: 'session_json_invalid',
      statusCode: sessionResponse.status,
    }
    return result
  }

  const betterAuthUser = session.user ?? null

  const result: BetterAuthLookupResult = {
    betterAuthUser,
    responseHeaders,
    failureReason: betterAuthUser ? null : 'missing_session_user',
    statusCode: sessionResponse.status,
  }
  if (cacheKey) writeSessionCache(cacheKey, result)
  return result
  })()

  if (!cacheKey) return lookupPromise

  betterAuthSessionInFlight.set(cacheKey, lookupPromise)
  try {
    return await lookupPromise
  } finally {
    betterAuthSessionInFlight.delete(cacheKey)
  }
}
