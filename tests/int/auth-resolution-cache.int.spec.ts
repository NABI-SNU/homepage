import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { resolvePayloadUserFromSession } from '@/auth/resolvePayloadUserFromSession'
import type { User } from '@/payload-types'

const createPayloadWithFind = (findImpl: Payload['find']) =>
  ({
    find: findImpl,
    update: vi.fn(),
    logger: {
      error: vi.fn(),
      info: vi.fn(),
    },
  }) as unknown as Payload

describe('resolvePayloadUserFromSession cache behavior', () => {
  it('does not cache null results that come from transient resolver failures', async () => {
    const cacheBuster = `${Date.now()}-${Math.random()}`
    const betterAuthUserID = `transient-user-${cacheBuster}`
    const user = {
      id: 101,
      betterAuthUserId: betterAuthUserID,
      email: `transient-${cacheBuster}@example.com`,
      isApproved: true,
      roles: 'admin',
    } as unknown as User

    let findCalls = 0
    const payload = createPayloadWithFind(
      vi.fn(async () => {
        findCalls += 1
        if (findCalls === 1) {
          throw new Error('database temporarily unavailable')
        }

        return {
          docs: [user],
        } as never
      }),
    )

    const firstAttempt = await resolvePayloadUserFromSession({
      payload,
      betterAuthUser: {
        id: betterAuthUserID,
        email: user.email,
        emailVerified: true,
      },
      requireApproval: false,
      autoApproveByPeopleEmail: false,
      enforceProductionEmailVerification: false,
    })

    const secondAttempt = await resolvePayloadUserFromSession({
      payload,
      betterAuthUser: {
        id: betterAuthUserID,
        email: user.email,
        emailVerified: true,
      },
      requireApproval: false,
      autoApproveByPeopleEmail: false,
      enforceProductionEmailVerification: false,
    })

    expect(firstAttempt).toBeNull()
    expect(secondAttempt?.id).toBe(user.id)
    expect(findCalls).toBe(2)
  })

  it('caches deterministic null when approval gate blocks access', async () => {
    const cacheBuster = `${Date.now()}-${Math.random()}`
    const betterAuthUserID = `approval-required-${cacheBuster}`
    const user = {
      id: 202,
      betterAuthUserId: betterAuthUserID,
      email: `approval-${cacheBuster}@example.com`,
      isApproved: false,
      roles: 'user',
    } as unknown as User

    let findCalls = 0
    const payload = createPayloadWithFind(
      vi.fn(async () => {
        findCalls += 1
        return {
          docs: [user],
        } as never
      }),
    )

    const firstAttempt = await resolvePayloadUserFromSession({
      payload,
      betterAuthUser: {
        id: betterAuthUserID,
        email: user.email,
        emailVerified: true,
      },
      requireApproval: true,
      autoApproveByPeopleEmail: false,
      enforceProductionEmailVerification: false,
    })

    const secondAttempt = await resolvePayloadUserFromSession({
      payload,
      betterAuthUser: {
        id: betterAuthUserID,
        email: user.email,
        emailVerified: true,
      },
      requireApproval: true,
      autoApproveByPeopleEmail: false,
      enforceProductionEmailVerification: false,
    })

    expect(firstAttempt).toBeNull()
    expect(secondAttempt).toBeNull()
    expect(findCalls).toBe(1)
  })
})
