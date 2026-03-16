import { beforeEach, describe, expect, it, vi } from 'vitest'

import { syncBetterAuthUserToPayload } from '@/auth/syncBetterAuthUserToPayload'

describe('syncBetterAuthUserToPayload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not claim an existing people profile by display name', async () => {
    const payload = {
      create: vi.fn().mockResolvedValueOnce({
        id: 901,
      }),
      find: vi
        .fn()
        .mockResolvedValueOnce({
          docs: [
            {
              email: 'new-member@example.com',
              id: 900,
              name: 'Existing Person',
              role: 'user',
              roles: 'user',
            },
          ],
        })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] }),
      update: vi.fn(),
    }

    await syncBetterAuthUserToPayload({
      betterAuthUser: {
        email: 'new-member@example.com',
        id: '900',
        name: 'Existing Person',
      },
      payload: payload as never,
    })

    expect(payload.find).toHaveBeenCalledTimes(3)
    const findCalls = payload.find.mock.calls as Array<Array<{ where?: Record<string, unknown> }>>
    expect(
      findCalls.some((call) => {
        const [args] = call
        return Boolean(args && 'name' in (args.where || {}))
      }),
    ).toBe(false)
    expect(payload.create).toHaveBeenCalledTimes(1)
    expect(payload.update).not.toHaveBeenCalled()
  })
})
