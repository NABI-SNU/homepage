import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { requireTestAccountUsers, userTestAccount } from '../helpers/testAccounts'

let payload: Payload
let users: Awaited<ReturnType<typeof requireTestAccountUsers>>

const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

describe('People Access', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    users = await requireTestAccountUsers(payload)
  })

  it('allows editing own bio, blocks editing another bio, and allows admin editing', async () => {
    let personAID: number | null = null
    let personAWasCreated = false
    let personBID: number | null = null

    try {
      const existingPersonA = (
        await payload.find({
          collection: 'people',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where: {
            user: {
              equals: users.user.id,
            },
          },
        })
      ).docs[0]

      if (existingPersonA) {
        personAID = existingPersonA.id
      } else {
        personAWasCreated = true
        const createdPersonA = await payload.create({
          collection: 'people',
          overrideAccess: true,
          context: { disableRevalidate: true },
          data: {
            name: userTestAccount.name,
            slug: `people-access-person-a-${runID}`,
            email: userTestAccount.email,
            years: [2026],
            memberType: 'user',
            user: users.user.id,
            bio: 'Original bio A',
          },
        })
        personAID = createdPersonA.id
      }

      const personB = await payload.create({
        collection: 'people',
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          name: `People Access Person B ${runID}`,
          slug: `people-access-person-b-${runID}`,
          email: `people-access-b-${runID}@example.com`,
          years: [2026],
          memberType: 'alumni',
          bio: 'Original bio B',
        },
      })

      personBID = personB.id

      const ownUpdate = await payload.update({
        collection: 'people',
        id: personAID,
        data: {
          bio: `Updated own bio ${runID}`,
        },
        user: users.user,
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
          user: users.user,
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
        user: users.admin,
        overrideAccess: false,
        context: { disableRevalidate: true },
      })

      expect(adminUpdated.bio).toBe(`Admin updated bio ${runID}`)
    } finally {
      if (personBID) {
        await payload.delete({
          collection: 'people',
          id: personBID,
          overrideAccess: true,
        })
      }

      if (personAWasCreated && personAID) {
        await payload.delete({
          collection: 'people',
          id: personAID,
          overrideAccess: true,
        })
      }
    }
  }, 30_000)
})
