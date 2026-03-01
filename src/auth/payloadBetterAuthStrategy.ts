import type { AuthStrategy } from 'payload'

import { auth } from './betterAuth'

const isProduction = process.env.NODE_ENV === 'production'

export const payloadBetterAuthStrategy: AuthStrategy = {
  name: 'better-auth',
  authenticate: async ({ headers, payload }) => {
    try {
      const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
      const sessionRequest = new Request(`${baseURL}/api/auth/get-session`, {
        method: 'GET',
        headers,
      })
      const sessionResponse = await auth.handler(sessionRequest)
      const responseHeaders = new Headers()
      const setCookieHeader = sessionResponse.headers.get('set-cookie')

      if (setCookieHeader) {
        responseHeaders.set('set-cookie', setCookieHeader)
      }

      if (!sessionResponse.ok) {
        return { user: null, responseHeaders }
      }

      const session = (await sessionResponse.json().catch(() => null)) as
        | {
            user?: {
              id?: string
              email?: string
              emailVerified?: boolean
            } | null
          }
        | null
      const betterAuthUser = session?.user

      if (!betterAuthUser?.id || !betterAuthUser?.email) {
        return { user: null, responseHeaders }
      }

      if (isProduction && betterAuthUser.emailVerified !== true) {
        return { user: null, responseHeaders }
      }

      const normalizedEmail = betterAuthUser.email.trim().toLowerCase()

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
          return { user: null, responseHeaders }
        }
      }

      const payloadUser = users.docs[0]
      if (!payloadUser) {
        return { user: null, responseHeaders }
      }

      if (payloadUser.isApproved !== true) {
        return { user: null, responseHeaders }
      }

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
        return { user: null, responseHeaders }
      }

      return {
        user: {
          ...payloadUser,
          _strategy: 'better-auth',
          collection: 'users',
        },
        responseHeaders,
      }
    } catch {
      return { user: null }
    }
  },
}
