import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { resolvePayloadUserFromSession } from '@/auth/resolvePayloadUserFromSession'

let payload: Payload

const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

describe('Auth Auto Approval', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it(
    'auto-approves unapproved user when matching people email exists and links person user',
    async () => {
      const email = `auto-approve-${runID}@example.com`
      const betterAuthUserID = `better-auth-auto-approve-${runID}`

      let userID: number | null = null
      let personID: number | null = null

      try {
        const user = await payload.create({
          collection: 'users',
          overrideAccess: true,
          data: {
            email,
            name: `Auto Approve ${runID}`,
            roles: 'user',
            isApproved: false,
          },
        })

        userID = user.id

        const person = await payload.create({
          collection: 'people',
          overrideAccess: true,
          context: { disableRevalidate: true },
          data: {
            name: `Auto Approve Person ${runID}`,
            slug: `auto-approve-person-${runID}`,
            email,
            joinedYear: 2026,
            memberType: 'user',
            user: null,
          },
        })

        personID = person.id

        const resolved = await resolvePayloadUserFromSession({
          payload,
          betterAuthUser: {
            id: betterAuthUserID,
            email,
            emailVerified: true,
          },
          requireApproval: true,
          autoApproveByPeopleEmail: true,
          enforceProductionEmailVerification: false,
        })

        expect(resolved?.id).toBe(user.id)
        expect(resolved?.isApproved).toBe(true)
        expect(resolved?.betterAuthUserId).toBe(betterAuthUserID)

        const updatedUser = await payload.findByID({
          collection: 'users',
          id: user.id,
          depth: 0,
          overrideAccess: true,
        })
        const updatedPerson = await payload.findByID({
          collection: 'people',
          id: person.id,
          depth: 0,
          overrideAccess: true,
        })

        const linkedUserID =
          typeof updatedPerson.user === 'object' ? updatedPerson.user?.id : updatedPerson.user

        expect(updatedUser.isApproved).toBe(true)
        expect(updatedUser.betterAuthUserId).toBe(betterAuthUserID)
        expect(linkedUserID).toBe(user.id)
      } finally {
        if (personID) {
          await payload.delete({
            collection: 'people',
            id: personID,
            overrideAccess: true,
          })
        }

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
})
