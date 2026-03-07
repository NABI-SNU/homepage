import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { POST } from '@/app/(frontend)/api/account/auth-state/route'

describe('account auth-state route', () => {
  it('returns a generic response for valid email lookups', async () => {
    const request = new NextRequest('http://localhost/api/account/auth-state', {
      body: JSON.stringify({
        email: 'member@example.com',
        intent: 'login',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })

    const response = await POST(request)
    const body = (await response.json()) as { allowed: boolean; reason: string }

    expect(response.status).toBe(200)
    expect(body.allowed).toBe(false)
    expect(body.reason).toBe('unknown')
  })

  it('rejects invalid email formats', async () => {
    const request = new NextRequest('http://localhost/api/account/auth-state', {
      body: JSON.stringify({
        email: 'not-an-email',
      }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    })

    const response = await POST(request)
    const body = (await response.json()) as { reason: string }

    expect(response.status).toBe(400)
    expect(body.reason).toBe('unknown')
  })
})
