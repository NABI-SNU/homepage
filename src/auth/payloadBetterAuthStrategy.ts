import type { AuthStrategy } from 'payload'

import { getBetterAuthUserFromHeaders } from './getBetterAuthUserFromHeaders'
import { strictPayloadSessionResolutionOptions } from './payloadSessionPolicy'
import { resolvePayloadUserFromSession } from './resolvePayloadUserFromSession'

const authDebugLogsEnabled = (): boolean =>
  ['1', 'true', 'yes', 'on'].includes((process.env.AUTH_DEBUG_LOGS || '').toLowerCase())

const getHeaderValue = (
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string,
): string => {
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name) || ''
  }

  const record = headers as Record<string, string | string[] | undefined>
  const value = record[name] ?? record[name.toLowerCase()]
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

const logAuthEvent = ({
  level,
  message,
  payload,
  details,
}: {
  level: 'error' | 'info' | 'warn'
  message: string
  payload: {
    logger: {
      error: (value: string) => void
      info: (value: string) => void
      warn: (value: string) => void
    }
  }
  details?: Record<string, unknown>
}) => {
  const serialized = details ? `${message} ${JSON.stringify(details)}` : message
  payload.logger[level](serialized)
}

const isAdminRequest = (
  headers: Headers | Record<string, string | string[] | undefined>,
): boolean => {
  const referer = getHeaderValue(headers, 'referer')
  if (referer.includes('/admin')) return true

  const pathname = getHeaderValue(headers, 'x-invoke-path')
  if (pathname.includes('/admin')) return true

  return false
}

const sanitizeResponseHeadersForAdmin = ({
  headers,
  responseHeaders,
}: {
  headers: Headers | Record<string, string | string[] | undefined>
  responseHeaders: Headers
}): Headers => {
  if (!isAdminRequest(headers)) return responseHeaders

  // Avoid forcing client refreshes from auth cookie rotation while editing admin forms.
  const sanitized = new Headers()
  for (const [key, value] of responseHeaders.entries()) {
    if (key.toLowerCase() === 'set-cookie') continue
    sanitized.append(key, value)
  }

  return sanitized
}

export const payloadBetterAuthStrategy: AuthStrategy = {
  name: 'better-auth',
  authenticate: async ({ headers, payload }) => {
    let responseHeaders = new Headers()

    try {
      const {
        betterAuthUser,
        failureReason,
        responseHeaders: lookupResponseHeaders,
        statusCode,
      } = await getBetterAuthUserFromHeaders(headers)
      responseHeaders = sanitizeResponseHeadersForAdmin({
        headers,
        responseHeaders: lookupResponseHeaders,
      })

      if (failureReason && failureReason !== 'missing_session_user') {
        logAuthEvent({
          level: 'warn',
          message: '[auth] BetterAuth strategy failed to resolve session user.',
          payload,
          details: {
            failureReason,
            statusCode,
            host: getHeaderValue(headers, 'host'),
            referer: getHeaderValue(headers, 'referer'),
          },
        })
      } else if (authDebugLogsEnabled()) {
        logAuthEvent({
          level: 'info',
          message: '[auth] BetterAuth strategy session lookup completed.',
          payload,
          details: {
            betterAuthUserID: betterAuthUser?.id || null,
            failureReason,
            statusCode,
            host: getHeaderValue(headers, 'host'),
            referer: getHeaderValue(headers, 'referer'),
          },
        })
      }

      if (!betterAuthUser) {
        return { user: null, responseHeaders }
      }

      const payloadUser = await resolvePayloadUserFromSession({
        payload,
        betterAuthUser,
        ...strictPayloadSessionResolutionOptions,
      })

      if (!payloadUser) {
        if (authDebugLogsEnabled()) {
          logAuthEvent({
            level: 'info',
            message: '[auth] BetterAuth strategy did not resolve a payload user.',
            payload,
            details: {
              betterAuthUserID: betterAuthUser.id || null,
              host: getHeaderValue(headers, 'host'),
              referer: getHeaderValue(headers, 'referer'),
            },
          })
        }
        return { user: null, responseHeaders }
      }

      if (authDebugLogsEnabled()) {
        logAuthEvent({
          level: 'info',
          message: '[auth] BetterAuth strategy resolved payload user.',
          payload,
          details: {
            betterAuthUserID: betterAuthUser.id || null,
            payloadUserID: payloadUser.id,
            host: getHeaderValue(headers, 'host'),
            referer: getHeaderValue(headers, 'referer'),
          },
        })
      }

      return {
        user: {
          ...payloadUser,
          _strategy: 'better-auth',
          collection: 'users',
        },
        responseHeaders,
      }
    } catch (error) {
      const details = {
        error: error instanceof Error ? error.message : String(error),
        host: getHeaderValue(headers, 'host'),
        referer: getHeaderValue(headers, 'referer'),
      }

      logAuthEvent({
        level: 'error',
        message: '[auth] BetterAuth strategy crashed during authentication.',
        payload,
        details,
      })

      return { user: null, responseHeaders }
    }
  },
}
