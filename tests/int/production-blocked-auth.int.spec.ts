import type { Payload } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  resolvePayloadUserFromSession,
  resolvePayloadUserFromSessionWithReason,
} from '@/auth/resolvePayloadUserFromSession'

const createMockPayload = () =>
  ({
    find: vi.fn(),
    logger: {
      error: vi.fn(),
      info: vi.fn(),
    },
    update: vi.fn(),
  }) as unknown as Payload

describe('production blocked auth accounts', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('blocks known shared test credentials in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const payload = createMockPayload()

    const resolved = await resolvePayloadUserFromSession({
      payload,
      betterAuthUser: {
        id: 'some-id',
        email: 'test@example.com',
        emailVerified: true,
      },
      requireApproval: true,
      autoApproveByPeopleEmail: true,
      enforceProductionEmailVerification: true,
    })

    expect(resolved).toBeNull()
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('returns invalid credentials reason for blocked shared accounts in auth-state checks', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const payload = createMockPayload()

    const resolved = await resolvePayloadUserFromSessionWithReason({
      payload,
      betterAuthUser: {
        id: 'some-id',
        email: 'dev@payloadcms.com',
        emailVerified: true,
      },
      requireApproval: true,
      autoApproveByPeopleEmail: true,
      enforceProductionEmailVerification: true,
    })

    expect(resolved.user).toBeNull()
    expect(resolved.reason).toBe('invalid_credentials')
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('supports custom production blocklist via AUTH_PRODUCTION_BLOCKED_EMAILS', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('AUTH_PRODUCTION_BLOCKED_EMAILS', 'admin@example.com')
    const payload = createMockPayload()

    const resolved = await resolvePayloadUserFromSessionWithReason({
      payload,
      betterAuthUser: {
        id: 'some-id',
        email: 'admin@example.com',
        emailVerified: true,
      },
      requireApproval: true,
      autoApproveByPeopleEmail: true,
      enforceProductionEmailVerification: true,
    })

    expect(resolved.user).toBeNull()
    expect(resolved.reason).toBe('invalid_credentials')
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('blocks production login for accounts linked to non-visible people profiles', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const payload = {
      find: vi
        .fn()
        .mockResolvedValueOnce({
          docs: [
            {
              id: 101,
              betterAuthUserId: 'visible-check',
              email: 'member@example.com',
              isApproved: true,
              roles: 'user',
            },
          ],
        })
        .mockResolvedValueOnce({
          docs: [
            {
              id: 501,
              isVisible: false,
              user: 101,
            },
          ],
        }),
      logger: {
        error: vi.fn(),
        info: vi.fn(),
      },
      update: vi.fn(),
    } as unknown as Payload

    const resolved = await resolvePayloadUserFromSessionWithReason({
      payload,
      betterAuthUser: {
        id: 'visible-check',
        email: 'member@example.com',
        emailVerified: true,
      },
      requireApproval: true,
      autoApproveByPeopleEmail: true,
      enforceProductionEmailVerification: true,
    })

    expect(resolved.user).toBeNull()
    expect(resolved.reason).toBe('invalid_credentials')
    expect(payload.find).toHaveBeenCalledTimes(2)
  })

  it('returns null for hidden linked profiles in production resolver path', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const payload = {
      find: vi
        .fn()
        .mockResolvedValueOnce({
          docs: [
            {
              id: 202,
              betterAuthUserId: 'hidden-resolver',
              email: 'hidden@example.com',
              isApproved: true,
              roles: 'user',
            },
          ],
        })
        .mockResolvedValueOnce({
          docs: [
            {
              id: 777,
              isVisible: false,
              user: 202,
            },
          ],
        }),
      logger: {
        error: vi.fn(),
        info: vi.fn(),
      },
      update: vi.fn(),
    } as unknown as Payload

    const resolved = await resolvePayloadUserFromSession({
      payload,
      betterAuthUser: {
        id: 'hidden-resolver',
        email: 'hidden@example.com',
        emailVerified: true,
      },
      requireApproval: true,
      autoApproveByPeopleEmail: true,
      enforceProductionEmailVerification: true,
    })

    expect(resolved).toBeNull()
    expect(payload.find).toHaveBeenCalledTimes(2)
  })
})
