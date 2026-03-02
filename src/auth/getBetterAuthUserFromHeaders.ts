import { auth } from './betterAuth'

import type { BetterAuthSessionUser } from './resolvePayloadUserFromSession'

type HeaderRecord = Record<string, string | string[] | undefined>
const isProduction = process.env.NODE_ENV === 'production'

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

const resolveBaseURLFromHeaders = (headers: Headers | HeaderRecord): string => {
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

  return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
}

export const getBetterAuthUserFromHeaders = async (
  headers: Headers | HeaderRecord,
): Promise<{
  betterAuthUser: BetterAuthSessionUser | null
  responseHeaders: Headers
}> => {
  const baseURL = resolveBaseURLFromHeaders(headers)
  const normalizedHeaders = new Headers(headers as HeadersInit)
  const sessionRequest = new Request(`${baseURL}/api/auth/get-session`, {
    method: 'GET',
    headers: normalizedHeaders,
  })
  const sessionResponse = await auth.handler(sessionRequest)
  const responseHeaders = new Headers()
  const setCookieHeader = sessionResponse.headers.get('set-cookie')

  if (setCookieHeader) {
    responseHeaders.set('set-cookie', setCookieHeader)
  }

  if (!sessionResponse.ok) {
    return {
      betterAuthUser: null,
      responseHeaders,
    }
  }

  const session = (await sessionResponse.json().catch(() => null)) as
    | {
        user?: BetterAuthSessionUser | null
      }
    | null

  return {
    betterAuthUser: session?.user ?? null,
    responseHeaders,
  }
}
