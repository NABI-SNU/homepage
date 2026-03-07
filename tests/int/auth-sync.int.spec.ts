import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getPayload } = vi.hoisted(() => ({
  getPayload: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import { syncBetterAuthUserToPayload } from '@/auth/syncBetterAuthUserToPayload'

describe('syncBetterAuthUserToPayload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not claim an existing people profile by display name', async () => {
    const payload = {
      create: vi
        .fn()
        .mockResolvedValueOnce({
          id: 900,
          betterAuthUserId: 'better-auth-1',
          email: 'new-member@example.com',
          name: 'Existing Person',
        })
        .mockResolvedValueOnce({
          id: 901,
        }),
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] }),
      update: vi.fn(),
    }

    getPayload.mockResolvedValue(payload)

    await syncBetterAuthUserToPayload({
      betterAuthUser: {
        email: 'new-member@example.com',
        id: 'better-auth-1',
        name: 'Existing Person',
      },
    })

    expect(payload.find).toHaveBeenCalledTimes(4)
    const findCalls = payload.find.mock.calls as Array<Array<{ where?: Record<string, unknown> }>>
    expect(
      findCalls.some((call) => {
        const [args] = call
        return Boolean(args && 'name' in (args.where || {}))
      }),
    ).toBe(false)
    expect(payload.create).toHaveBeenCalledTimes(2)
    expect(payload.update).not.toHaveBeenCalled()
  })
})
