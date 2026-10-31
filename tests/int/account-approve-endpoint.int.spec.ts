import { NextRequest } from 'next/server'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { createUserApprovalToken } from '@/auth/approvalToken'
import config from '@/payload.config'
import {
  GET as approveUserGET,
  POST as approveUserPOST,
} from '@/app/(frontend)/api/account/approve/route'
import { requireTestAccountUsers, userTestAccount } from '../helpers/testAccounts'

let payload: Payload
let users: Awaited<ReturnType<typeof requireTestAccountUsers>>

describe('Account Approve Endpoint', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    users = await requireTestAccountUsers(payload)
  })

  it('redirects with already status for the pre-approved fixed user account', async () => {
    if (users.user.isApproved !== true) {
      throw new Error(
        `"${userTestAccount.email}" must be approved for this test. Tests must use pre-seeded accounts.`,
      )
    }

    const token = createUserApprovalToken(users.user.id)
    const response = await approveUserGET(
      new NextRequest(
        `http://localhost:3000/api/account/approve?token=${encodeURIComponent(token)}`,
      ),
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('/account?approval=already')
  }, 30_000)

  it('does not approve on POST without an admin session', async () => {
    const pendingUser = await payload.create({
      collection: 'users',
      overrideAccess: true,
      depth: 0,
      data: {
        email: `approve-endpoint-${Date.now()}@example.com`,
        emailVerified: false,
        isApproved: false,
        name: 'Approve Endpoint Pending',
        role: 'user',
        roles: 'user',
      },
    })

    try {
      const token = createUserApprovalToken(pendingUser.id)

      // GET never changes state: it only renders the confirmation (here: the sign-in prompt).
      const getResponse = await approveUserGET(
        new NextRequest(
          `http://localhost:3000/api/account/approve?token=${encodeURIComponent(token)}`,
        ),
      )
      expect(getResponse.status).toBe(401)
      expect(getResponse.headers.get('content-type')).toContain('text/html')

      const postResponse = await approveUserPOST(
        new NextRequest('http://localhost:3000/api/account/approve', {
          body: JSON.stringify({ token }),
          headers: { 'content-type': 'application/json' },
          method: 'POST',
        }),
      )
      expect(postResponse.status).toBe(302)
      expect(postResponse.headers.get('location')).toContain('/account?approval=forbidden')

      const refreshed = await payload.findByID({
        collection: 'users',
        id: pendingUser.id,
        depth: 0,
        overrideAccess: true,
      })
      expect(refreshed.isApproved).toBe(false)
    } finally {
      await payload.delete({ collection: 'users', id: pendingUser.id, overrideAccess: true })
    }
  }, 30_000)

  it('redirects with invalid status for malformed tokens', async () => {
    const response = await approveUserGET(
      new NextRequest('http://localhost:3000/api/account/approve?token=not-a-valid-token'),
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('/account?approval=invalid')
  })
})
