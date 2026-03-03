import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload

const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

const buildMinimalRichText = () => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Test content',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

describe('Posts Access', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it(
    'allows own-post edits, blocks cross-user edits, and allows admins to edit all posts',
    async () => {
      const emailA = `post-access-a-${runId}@example.com`
      const emailB = `post-access-b-${runId}@example.com`
      const emailAdmin = `post-access-admin-${runId}@example.com`

      let userAId: number | null = null
      let userBId: number | null = null
      let adminUserID: number | null = null
      let personAId: number | null = null
      let personBId: number | null = null
      let postAId: number | null = null
      let postBId: number | null = null

      try {
        const [userA, userB, adminUser] = await Promise.all([
          payload.create({
            collection: 'users',
            overrideAccess: true,
            data: {
              email: emailA,
              name: `Post Access A ${runId}`,
              roles: 'user',
              isApproved: true,
              betterAuthUserId: `better-auth-a-${runId}`,
            },
          }),
          payload.create({
            collection: 'users',
            overrideAccess: true,
            data: {
              email: emailB,
              name: `Post Access B ${runId}`,
              roles: 'user',
              isApproved: true,
              betterAuthUserId: `better-auth-b-${runId}`,
            },
          }),
          payload.create({
            collection: 'users',
            overrideAccess: true,
            data: {
              email: emailAdmin,
              name: `Post Access Admin ${runId}`,
              roles: 'admin',
              isApproved: true,
              betterAuthUserId: `better-auth-admin-${runId}`,
            },
          }),
        ])

        userAId = userA.id
        userBId = userB.id
        adminUserID = adminUser.id

        const [personA, personB] = await Promise.all([
          payload.create({
            collection: 'people',
            overrideAccess: true,
            context: { disableRevalidate: true },
            data: {
              name: `Post Access Person A ${runId}`,
              slug: `post-access-person-a-${runId}`,
              email: emailA,
              joinedYear: 2026,
              memberType: 'user',
              user: userA.id,
            },
          }),
          payload.create({
            collection: 'people',
            overrideAccess: true,
            context: { disableRevalidate: true },
            data: {
              name: `Post Access Person B ${runId}`,
              slug: `post-access-person-b-${runId}`,
              email: emailB,
              joinedYear: 2026,
              memberType: 'user',
              user: userB.id,
            },
          }),
        ])

        personAId = personA.id
        personBId = personB.id

        const [postByA, postByB] = await Promise.all([
          payload.create({
            collection: 'posts',
            overrideAccess: true,
            context: { disableRevalidate: true },
            data: {
              title: `Authored Post A ${runId}`,
              slug: `authored-post-a-${runId}`,
              authors: [personA.id],
              content: buildMinimalRichText() as any,
              _status: 'draft',
            },
          }),
          payload.create({
            collection: 'posts',
            overrideAccess: true,
            context: { disableRevalidate: true },
            data: {
              title: `Authored Post B ${runId}`,
              slug: `authored-post-b-${runId}`,
              authors: [personB.id],
              content: buildMinimalRichText() as any,
              _status: 'draft',
            },
          }),
        ])

        postAId = postByA.id
        postBId = postByB.id

        const updatedOwnPost = await payload.update({
          collection: 'posts',
          id: postByA.id,
          data: {
            excerpt: `Updated by author ${runId}`,
          },
          user: userA,
          overrideAccess: false,
          context: { disableRevalidate: true },
        })

        expect(updatedOwnPost.excerpt).toBe(`Updated by author ${runId}`)

        await expect(
          payload.update({
            collection: 'posts',
            id: postByB.id,
            data: {
              excerpt: `Unauthorized update ${runId}`,
            },
            user: userA,
            overrideAccess: false,
            context: { disableRevalidate: true },
          }),
        ).rejects.toThrow()

        const adminUpdatedA = await payload.update({
          collection: 'posts',
          id: postByA.id,
          data: {
            excerpt: `Admin updated A ${runId}`,
          },
          user: adminUser,
          overrideAccess: false,
          context: { disableRevalidate: true },
        })

        const adminUpdatedB = await payload.update({
          collection: 'posts',
          id: postByB.id,
          data: {
            excerpt: `Admin updated B ${runId}`,
          },
          user: adminUser,
          overrideAccess: false,
          context: { disableRevalidate: true },
        })

        expect(adminUpdatedA.excerpt).toBe(`Admin updated A ${runId}`)
        expect(adminUpdatedB.excerpt).toBe(`Admin updated B ${runId}`)
      } finally {
        if (postAId) {
          await payload.delete({
            collection: 'posts',
            id: postAId,
            overrideAccess: true,
            context: { disableRevalidate: true },
          })
        }

        if (postBId) {
          await payload.delete({
            collection: 'posts',
            id: postBId,
            overrideAccess: true,
            context: { disableRevalidate: true },
          })
        }

        if (personAId) {
          await payload.delete({
            collection: 'people',
            id: personAId,
            overrideAccess: true,
          })
        }

        if (personBId) {
          await payload.delete({
            collection: 'people',
            id: personBId,
            overrideAccess: true,
          })
        }

        if (userAId) {
          await payload.delete({
            collection: 'users',
            id: userAId,
            overrideAccess: true,
          })
        }

        if (userBId) {
          await payload.delete({
            collection: 'users',
            id: userBId,
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
