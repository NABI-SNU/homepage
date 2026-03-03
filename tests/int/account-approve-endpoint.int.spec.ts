import { NextRequest } from 'next/server'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { createUserApprovalToken } from '@/auth/approvalToken'
import config from '@/payload.config'
import { GET as approveUserGET } from '@/app/(frontend)/api/account/approve/route'
import { requireTestAccountUsers, userTestAccount } from '../helpers/testAccounts'

let payload: Payload
let users: Awaited<ReturnType<typeof requireTestAccountUsers>>

describe('Account Approve Endpoint', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    users = await requireTestAccountUsers(payload)
  })

  it(
    'redirects with already status for the pre-approved fixed user account',
    async () => {
      if (users.user.isApproved !== true) {
        throw new Error(
          `"${userTestAccount.email}" must be approved for this test. Tests must use pre-seeded accounts.`,
        )
      }

      const token = createUserApprovalToken(users.user.id)
      const response = await approveUserGET(
        new NextRequest(`http://localhost:3000/api/account/approve?token=${encodeURIComponent(token)}`),
      )

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('/account?approval=already')
    },
    30_000,
  )

  it('redirects with invalid status for malformed tokens', async () => {
    const response = await approveUserGET(
      new NextRequest('http://localhost:3000/api/account/approve?token=not-a-valid-token'),
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('/account?approval=invalid')
  })
})
