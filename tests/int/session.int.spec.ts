import { describe, expect, it, vi } from 'vitest'

import { getServerSession } from '@/auth/session'

describe('Better Auth session helpers', () => {
  it('logs an error when Better Auth is not initialized on the payload instance', async () => {
    const payload = {
      logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      },
    }

    const session = await getServerSession(payload as never, new Headers())

    expect(session).toBeNull()
    expect(payload.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"auth_not_initialized"'),
    )
  })

  it('logs a warning when the session lookup returns no active user', async () => {
    const payload = {
      betterAuth: {
        api: {
          getSession: vi.fn().mockResolvedValue({
            session: null,
            user: null,
          }),
        },
      },
      logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      },
    }

    const session = await getServerSession(payload as never, new Headers())

    expect(session).toBeNull()
    expect(payload.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"missing_session_user"'),
    )
  })

  it('logs an error when the Better Auth session lookup throws', async () => {
    const payload = {
      betterAuth: {
        api: {
          getSession: vi.fn().mockRejectedValue(new Error('session exploded')),
        },
      },
      logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
      },
    }

    const session = await getServerSession(payload as never, new Headers())

    expect(session).toBeNull()
    expect(payload.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('"reason":"session_lookup_failed"'),
    )
  })
})
