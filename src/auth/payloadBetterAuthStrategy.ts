import type { AuthStrategy } from 'payload'

import { getBetterAuthUserFromHeaders } from './getBetterAuthUserFromHeaders'
import { resolvePayloadUserFromSession } from './resolvePayloadUserFromSession'

export const payloadBetterAuthStrategy: AuthStrategy = {
  name: 'better-auth',
  authenticate: async ({ headers, payload }) => {
    try {
      const { betterAuthUser, responseHeaders } = await getBetterAuthUserFromHeaders(headers)
      if (!betterAuthUser) {
        return { user: null, responseHeaders }
      }

      const payloadUser = await resolvePayloadUserFromSession({
        payload,
        betterAuthUser,
        requireApproval: true,
        autoApproveByPeopleEmail: true,
        enforceProductionEmailVerification: true,
        denyAlumni: true,
      })

      if (!payloadUser) {
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
