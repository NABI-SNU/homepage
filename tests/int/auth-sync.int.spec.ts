import { beforeEach, describe, expect, it, vi } from 'vitest'

import { syncBetterAuthUserToPayload } from '@/auth/syncBetterAuthUserToPayload'

type FindArgs = { collection?: string; where?: Record<string, unknown> }

/**
 * The user row is the member profile. The sync only fills profile defaults, and it never claims
 * another record by display name: a listed member is only merged in once the account has
 * verified the matching contact email.
 */
describe('syncBetterAuthUserToPayload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not look up or claim an existing member by display name', async () => {
    const payload = {
      create: vi.fn(),
      delete: vi.fn(),
      find: vi.fn().mockResolvedValueOnce({
        docs: [
          {
            email: 'new-member@example.com',
            emailVerified: false,
            id: 900,
            isApproved: false,
            isVisible: false,
            memberType: 'user',
            name: 'Existing Person',
            role: 'user',
            roles: 'user',
            years: [2026],
          },
        ],
      }),
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

    // Only the own-record lookup; no contact-email match is attempted while unverified.
    expect(payload.find).toHaveBeenCalledTimes(1)
    const findCalls = payload.find.mock.calls as Array<[FindArgs]>
    expect(findCalls.every(([args]) => args.collection === 'users')).toBe(true)
    expect(findCalls.some(([args]) => Boolean(args.where && 'name' in args.where))).toBe(false)
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.delete).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('fills in profile defaults for a fresh account without approving it', async () => {
    const payload = {
      create: vi.fn(),
      delete: vi.fn(),
      find: vi
        .fn()
        // own record
        .mockResolvedValueOnce({
          docs: [
            {
              email: 'fresh@example.com',
              emailVerified: true,
              id: 901,
              isApproved: false,
              isVisible: false,
              memberType: null,
              name: '',
              role: 'user',
              roles: 'user',
              years: null,
            },
          ],
        })
        // verified, so a listed member with this contact email is looked for: none
        .mockResolvedValueOnce({ docs: [] }),
      update: vi.fn().mockResolvedValue({}),
    }

    await syncBetterAuthUserToPayload({
      betterAuthUser: {
        email: 'fresh@example.com',
        emailVerified: true,
        id: '901',
        name: 'Fresh Account',
      },
      payload: payload as never,
    })

    expect(payload.find).toHaveBeenCalledTimes(2)
    expect(payload.update).toHaveBeenCalledTimes(1)
    const [updateArgs] = payload.update.mock.calls[0] as [
      { collection: string; data: Record<string, unknown>; id: number },
    ]
    expect(updateArgs.collection).toBe('users')
    expect(updateArgs.id).toBe(901)
    expect(updateArgs.data).toEqual(
      expect.objectContaining({
        memberType: 'user',
        name: 'Fresh Account',
        years: [new Date().getUTCFullYear()],
      }),
    )
    // Self-registered, hidden accounts still need an admin.
    expect(updateArgs.data).not.toHaveProperty('isApproved')
    expect(payload.delete).not.toHaveBeenCalled()
  })

  it('ignores Better Auth ids that are not Payload user ids', async () => {
    const payload = {
      create: vi.fn(),
      delete: vi.fn(),
      find: vi.fn(),
      update: vi.fn(),
    }

    await syncBetterAuthUserToPayload({
      betterAuthUser: {
        email: 'legacy@example.com',
        id: 'legacy-better-auth-id',
      },
      payload: payload as never,
    })

    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })
})
