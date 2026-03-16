import { beforeEach, describe, expect, it, vi } from 'vitest'

import { syncBetterAuthUserToPayload } from '@/auth/syncBetterAuthUserToPayload'

describe('auth sync auto-approval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('auto-approves a user when a visible person profile already matches the email', async () => {
    const payload = {
      create: vi.fn(),
      find: vi
        .fn()
        .mockResolvedValueOnce({
          docs: [
            {
              id: 25,
              email: 'member@example.com',
              isApproved: false,
              role: 'user',
              roles: 'user',
            },
          ],
        })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({
          docs: [
            {
              id: 90,
              isVisible: true,
              user: null,
            },
          ],
        }),
      update: vi
        .fn()
        .mockResolvedValueOnce({
          id: 90,
          isVisible: true,
          user: 25,
        })
        .mockResolvedValueOnce({
          id: 25,
          email: 'member@example.com',
          isApproved: true,
          role: 'user',
          roles: 'user',
        }),
    }

    await syncBetterAuthUserToPayload({
      betterAuthUser: {
        email: 'member@example.com',
        id: '25',
        name: 'Member Example',
      },
      payload: payload as never,
    })

    expect(payload.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'people',
        data: expect.objectContaining({
          user: 25,
        }),
        id: 90,
      }),
    )
    expect(payload.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'users',
        data: expect.objectContaining({
          isApproved: true,
        }),
        id: 25,
      }),
    )
  })
})
