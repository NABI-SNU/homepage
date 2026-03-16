import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { resolvePayloadUserFromSession } from '@/auth/resolvePayloadUserFromSession'
import type { User } from '@/payload-types'

const createPayloadWithFind = (findImpl: Payload['find']) =>
  ({
    find: findImpl,
    logger: {
      error: vi.fn(),
      info: vi.fn(),
    },
  }) as unknown as Payload

describe('resolvePayloadUserFromSession stability behavior', () => {
  it('re-runs lookups instead of reusing a cached resolver result', async () => {
    const user = {
      id: 101,
      email: 'transient@example.com',
      role: 'admin',
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

        if (findCalls === 2) {
          return {
            docs: [user],
          } as never
        }

        return {
          docs: [],
        } as never
      }),
    )

    const firstAttempt = await resolvePayloadUserFromSession({
      payload,
      betterAuthUser: {
        id: '101',
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
        id: '101',
        email: user.email,
        emailVerified: true,
      },
      requireApproval: false,
      autoApproveByPeopleEmail: false,
      enforceProductionEmailVerification: false,
    })

    expect(firstAttempt).toBeNull()
    expect(secondAttempt?.id).toBe(user.id)
    expect(findCalls).toBe(3)
  })

  it('never mutates payload users during request-time auth resolution', async () => {
    const user = {
      id: 202,
      email: 'approval@example.com',
      role: 'user',
      isApproved: false,
      roles: 'user',
    } as unknown as User

    const payload = {
      find: vi.fn(async () => ({
        docs: [user],
      })),
      logger: {
        error: vi.fn(),
        info: vi.fn(),
      },
      update: vi.fn(),
    } as unknown as Payload

    const firstAttempt = await resolvePayloadUserFromSession({
      payload,
      betterAuthUser: {
        id: '202',
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
        id: '202',
        email: user.email,
        emailVerified: true,
      },
      requireApproval: true,
      autoApproveByPeopleEmail: false,
      enforceProductionEmailVerification: false,
    })

    expect(firstAttempt).toBeNull()
    expect(secondAttempt).toBeNull()
    expect(payload.find).toHaveBeenCalledTimes(4)
    expect(payload.update).not.toHaveBeenCalled()
  })
})
