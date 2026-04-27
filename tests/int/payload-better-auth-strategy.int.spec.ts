import { beforeEach, describe, expect, it, vi } from 'vitest'

import { payloadBetterAuthStrategy } from '@/auth/payloadBetterAuthStrategy'
import { Users } from '@/collections/Users'

describe('Payload Better Auth strategy wiring', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('configures the users collection with the package better-auth strategy', () => {
    const authConfig = Users.auth

    if (!authConfig || typeof authConfig === 'boolean') {
      throw new Error('Users auth config is not defined')
    }

    expect(authConfig.strategies).toHaveLength(1)
    expect(authConfig.strategies?.[0]?.name).toBe('better-auth')
  })

  it('resolves payload users from a numeric Better Auth session user id', async () => {
    const strategy = payloadBetterAuthStrategy({ idType: 'number' })
    const payload = {
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
      },
      betterAuth: {
        api: {
          getSession: vi.fn().mockResolvedValue({
            session: {
              id: 'session-1',
            },
            user: {
              id: '7',
            },
          }),
        },
      },
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            email: 'admin@example.com',
            id: 7,
            role: 'admin',
            roles: 'admin',
          },
        ],
      }),
    }

    const result = await strategy.authenticate({
      headers: new Headers(),
      payload: payload as never,
    })

    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          id: {
            equals: 7,
          },
        },
      }),
    )
    expect(result.user).toMatchObject({
      id: 7,
      role: 'admin',
      roles: 'admin',
    })
  })

  it('falls back to betterAuthUserId when session ids are string-based', async () => {
    const strategy = payloadBetterAuthStrategy({ idType: 'number' })
    const payload = {
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
      },
      betterAuth: {
        api: {
          getSession: vi.fn().mockResolvedValue({
            session: {
              id: 'session-1',
            },
            user: {
              email: 'admin@example.com',
              id: 'legacy-better-auth-user-id',
            },
          }),
        },
      },
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({
          docs: [
            {
              betterAuthUserId: 'legacy-better-auth-user-id',
              email: 'admin@example.com',
              id: 7,
              role: 'admin',
              roles: 'admin',
            },
          ],
        }),
    }

    const result = await strategy.authenticate({
      headers: new Headers(),
      payload: payload as never,
    })

    expect(payload.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          betterAuthUserId: {
            equals: 'legacy-better-auth-user-id',
          },
        },
      }),
    )
    expect(result.user).toMatchObject({
      id: 7,
      role: 'admin',
      roles: 'admin',
    })
  })

  it('returns a null user when Better Auth has no active session', async () => {
    const strategy = payloadBetterAuthStrategy({ idType: 'number' })
    const payload = {
      logger: {
        error: vi.fn(),
        warn: vi.fn(),
      },
      betterAuth: {
        api: {
          getSession: vi.fn().mockResolvedValue(null),
        },
      },
      find: vi.fn(),
    }

    const result = await strategy.authenticate({
      headers: new Headers(),
      payload: payload as never,
    })

    expect(result.user).toBeNull()
    expect(payload.find).not.toHaveBeenCalled()
  })
})
