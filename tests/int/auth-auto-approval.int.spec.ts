import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { resolvePayloadUserFromSession } from '@/auth/resolvePayloadUserFromSession'
import { requireTestAccountUsers, userTestAccount } from '../helpers/testAccounts'

let payload: Payload
let users: Awaited<ReturnType<typeof requireTestAccountUsers>>

describe('Auth Session Resolution', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    users = await requireTestAccountUsers(payload)
  })

  it(
    'resolves the existing fixed user account from BetterAuth session data',
    async () => {
      if (!users.user.betterAuthUserId) {
        throw new Error(
          `"${userTestAccount.email}" must have betterAuthUserId populated. Tests must use pre-seeded accounts.`,
        )
      }

      const resolved = await resolvePayloadUserFromSession({
        payload,
        betterAuthUser: {
          id: users.user.betterAuthUserId,
          email: userTestAccount.email,
          emailVerified: true,
        },
        requireApproval: true,
        autoApproveByPeopleEmail: true,
        enforceProductionEmailVerification: false,
      })

      expect(resolved?.id).toBe(users.user.id)
      expect(resolved?.isApproved).toBe(true)
      expect(resolved?.email?.toLowerCase()).toBe(userTestAccount.email)
    },
    30_000,
  )
})
