import { NextRequest } from 'next/server'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { createUserApprovalToken } from '@/auth/approvalToken'
import config from '@/payload.config'
import { GET as approveUserGET } from '@/app/(frontend)/api/account/approve/route'

let payload: Payload

const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

describe('Account Approve Endpoint', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it(
    'approves user and redirects with approved status',
    async () => {
      const email = `approve-endpoint-${runID}@example.com`

      let userID: number | null = null

      try {
        const user = await payload.create({
          collection: 'users',
          overrideAccess: true,
          data: {
            email,
            name: `Approve Endpoint ${runID}`,
            roles: 'user',
            isApproved: false,
            betterAuthUserId: `better-auth-approve-endpoint-${runID}`,
          },
        })

        userID = user.id

        const token = createUserApprovalToken(user.id)
        const response = await approveUserGET(
          new NextRequest(
            `http://localhost:3000/api/account/approve?token=${encodeURIComponent(token)}`,
          ),
        )

        expect(response.status).toBe(302)
        expect(response.headers.get('location')).toContain('/account?approval=approved')

        const updatedUser = await payload.findByID({
          collection: 'users',
          id: user.id,
          depth: 0,
          overrideAccess: true,
        })

        expect(updatedUser.isApproved).toBe(true)
      } finally {
        if (userID) {
          await payload.delete({
            collection: 'users',
            id: userID,
            overrideAccess: true,
          })
        }
      }
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
