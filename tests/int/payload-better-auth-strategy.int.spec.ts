import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getBetterAuthUserFromHeaders, resolvePayloadUserFromSession } = vi.hoisted(() => ({
  getBetterAuthUserFromHeaders: vi.fn(),
  resolvePayloadUserFromSession: vi.fn(),
}))

vi.mock('@/auth/getBetterAuthUserFromHeaders', () => ({
  getBetterAuthUserFromHeaders,
}))

vi.mock('@/auth/resolvePayloadUserFromSession', () => ({
  resolvePayloadUserFromSession,
}))

import { payloadBetterAuthStrategy } from '@/auth/payloadBetterAuthStrategy'

const createMockPayload = () => {
  const error = vi.fn()
  const info = vi.fn()
  const warn = vi.fn()

  return {
    logger: {
      error,
      info,
      warn,
    },
  }
}

describe('payloadBetterAuthStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.AUTH_DEBUG_LOGS
  })

  it('returns null user with propagated response headers when BetterAuth session is missing', async () => {
    const responseHeaders = new Headers()
    responseHeaders.append('set-cookie', 'a=b; Path=/; HttpOnly')

    getBetterAuthUserFromHeaders.mockResolvedValueOnce({
      betterAuthUser: null,
      responseHeaders,
      failureReason: 'missing_session_user',
      statusCode: 200,
    })

    const payload = createMockPayload()
    const result = await payloadBetterAuthStrategy.authenticate({
      headers: new Headers(),
      payload: payload as never,
    })

    expect(result.user).toBeNull()
    expect(result.responseHeaders).toBeDefined()
    expect(result.responseHeaders?.get('set-cookie') || '').toContain('a=b')
    expect(resolvePayloadUserFromSession).not.toHaveBeenCalled()
  })

  it('strips set-cookie headers for admin requests to avoid forced reloads', async () => {
    const responseHeaders = new Headers()
    responseHeaders.append('set-cookie', 'session=value; Path=/; HttpOnly')

    getBetterAuthUserFromHeaders.mockResolvedValueOnce({
      betterAuthUser: null,
      responseHeaders,
      failureReason: 'missing_session_user',
      statusCode: 200,
    })

    const payload = createMockPayload()
    const result = await payloadBetterAuthStrategy.authenticate({
      headers: new Headers({
        referer: 'http://localhost:3000/admin/globals/footer',
      }),
      payload: payload as never,
    })

    expect(result.user).toBeNull()
    expect(result.responseHeaders).toBeDefined()
    expect(result.responseHeaders?.get('set-cookie')).toBeNull()
  })

  it('logs and safely returns null user when resolver throws', async () => {
    const responseHeaders = new Headers()
    responseHeaders.append('set-cookie', 'session=value; Path=/; HttpOnly')

    getBetterAuthUserFromHeaders.mockResolvedValueOnce({
      betterAuthUser: {
        id: 'better-auth-user-1',
        email: 'admin@example.com',
        emailVerified: true,
      },
      responseHeaders,
      failureReason: null,
      statusCode: 200,
    })
    resolvePayloadUserFromSession.mockRejectedValueOnce(new Error('transient db error'))

    const payload = createMockPayload()
    const result = await payloadBetterAuthStrategy.authenticate({
      headers: new Headers(),
      payload: payload as never,
    })

    expect(result.user).toBeNull()
    expect(result.responseHeaders).toBeDefined()
    expect(result.responseHeaders?.get('set-cookie') || '').toContain('session=value')
    expect(payload.logger.error).toHaveBeenCalledOnce()
  })
})
