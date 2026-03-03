import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload

const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

describe('People Access', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it(
    'allows editing own bio, blocks editing another bio, and allows admin editing',
    async () => {
      const emailA = `people-access-a-${runID}@example.com`
      const emailB = `people-access-b-${runID}@example.com`
      const emailAdmin = `people-access-admin-${runID}@example.com`

      let userAID: number | null = null
      let userBID: number | null = null
      let adminUserID: number | null = null
      let personAID: number | null = null
      let personBID: number | null = null

      try {
        const [userA, userB, adminUser] = await Promise.all([
          payload.create({
            collection: 'users',
            overrideAccess: true,
            data: {
              email: emailA,
              name: `People Access A ${runID}`,
              roles: 'user',
              isApproved: true,
              betterAuthUserId: `better-auth-people-a-${runID}`,
            },
          }),
          payload.create({
            collection: 'users',
            overrideAccess: true,
            data: {
              email: emailB,
              name: `People Access B ${runID}`,
              roles: 'user',
              isApproved: true,
              betterAuthUserId: `better-auth-people-b-${runID}`,
            },
          }),
          payload.create({
            collection: 'users',
            overrideAccess: true,
            data: {
              email: emailAdmin,
              name: `People Access Admin ${runID}`,
              roles: 'admin',
              isApproved: true,
              betterAuthUserId: `better-auth-people-admin-${runID}`,
            },
          }),
        ])

        userAID = userA.id
        userBID = userB.id
        adminUserID = adminUser.id

        const [personA, personB] = await Promise.all([
          payload.create({
            collection: 'people',
            overrideAccess: true,
            context: { disableRevalidate: true },
            data: {
              name: `People Access Person A ${runID}`,
              slug: `people-access-person-a-${runID}`,
              email: emailA,
              joinedYear: 2026,
              memberType: 'user',
              user: userA.id,
              bio: 'Original bio A',
            },
          }),
          payload.create({
            collection: 'people',
            overrideAccess: true,
            context: { disableRevalidate: true },
            data: {
              name: `People Access Person B ${runID}`,
              slug: `people-access-person-b-${runID}`,
              email: emailB,
              joinedYear: 2026,
              memberType: 'user',
              user: userB.id,
              bio: 'Original bio B',
            },
          }),
        ])

        personAID = personA.id
        personBID = personB.id

        const ownUpdate = await payload.update({
          collection: 'people',
          id: personA.id,
          data: {
            bio: `Updated own bio ${runID}`,
          },
          user: userA,
          overrideAccess: false,
          context: { disableRevalidate: true },
        })

        expect(ownUpdate.bio).toBe(`Updated own bio ${runID}`)

        await expect(
          payload.update({
            collection: 'people',
            id: personB.id,
            data: {
              bio: `Unauthorized update ${runID}`,
            },
            user: userA,
            overrideAccess: false,
            context: { disableRevalidate: true },
          }),
        ).rejects.toThrow()

        const adminUpdated = await payload.update({
          collection: 'people',
          id: personB.id,
          data: {
            bio: `Admin updated bio ${runID}`,
          },
          user: adminUser,
          overrideAccess: false,
          context: { disableRevalidate: true },
        })

        expect(adminUpdated.bio).toBe(`Admin updated bio ${runID}`)
      } finally {
        if (personAID) {
          await payload.delete({
            collection: 'people',
            id: personAID,
            overrideAccess: true,
          })
        }

        if (personBID) {
          await payload.delete({
            collection: 'people',
            id: personBID,
            overrideAccess: true,
          })
        }

        if (userAID) {
          await payload.delete({
            collection: 'users',
            id: userAID,
            overrideAccess: true,
          })
        }

        if (userBID) {
          await payload.delete({
            collection: 'users',
            id: userBID,
            overrideAccess: true,
          })
        }

        if (adminUserID) {
          await payload.delete({
            collection: 'users',
            id: adminUserID,
            overrideAccess: true,
          })
        }
      }
    },
    30_000,
  )
})

