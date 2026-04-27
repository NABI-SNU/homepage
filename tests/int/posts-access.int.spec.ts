import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { requireTestAccountUsers, userTestAccount } from '../helpers/testAccounts'

let payload: Payload
let users: Awaited<ReturnType<typeof requireTestAccountUsers>>

const runId = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

const buildMinimalRichText = (): DefaultTypedEditorState => ({
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

const normalizeRelationshipID = (
  value: number | { id: number } | null | undefined,
): number | null => {
  if (!value) return null
  if (typeof value === 'number') return value
  return typeof value.id === 'number' ? value.id : null
}

describe('Posts Access', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    users = await requireTestAccountUsers(payload)
  })

  it('allows own-post edits, blocks cross-user edits, and allows admins to edit all posts', async () => {
    let authorPersonId: number | null = null
    let authorPersonWasCreated = false
    let otherPersonId: number | null = null
    let postAId: number | null = null
    let postBId: number | null = null
    let userCreatedPostId: number | null = null

    try {
      const existingAuthorPerson = (
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

      if (existingAuthorPerson) {
        authorPersonId = existingAuthorPerson.id
      } else {
        authorPersonWasCreated = true
        const createdAuthorPerson = await payload.create({
          collection: 'people',
          overrideAccess: true,
          context: { disableRevalidate: true },
          data: {
            name: userTestAccount.name,
            slug: `post-access-person-a-${runId}`,
            email: userTestAccount.email,
            years: [2026],
            memberType: 'user',
            user: users.user.id,
          },
        })
        authorPersonId = createdAuthorPerson.id
      }

      const otherPerson = await payload.create({
        collection: 'people',
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          name: `Post Access Person B ${runId}`,
          slug: `post-access-person-b-${runId}`,
          email: `post-access-b-${runId}@example.com`,
          years: [2026],
          memberType: 'alumni',
        },
      })

      otherPersonId = otherPerson.id

      const [postByA, postByB] = await Promise.all([
        payload.create({
          collection: 'posts',
          overrideAccess: true,
          context: { disableRevalidate: true },
          data: {
            title: `Authored Post A ${runId}`,
            slug: `authored-post-a-${runId}`,
            authors: [authorPersonId],
            content: buildMinimalRichText(),
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
            authors: [otherPerson.id],
            content: buildMinimalRichText(),
            _status: 'draft',
          },
        }),
      ])

      postAId = postByA.id
      postBId = postByB.id

      const createdByUser = await payload.create({
        collection: 'posts',
        user: users.user,
        overrideAccess: false,
        context: { disableRevalidate: true },
        data: {
          title: `Authored Post User Create ${runId}`,
          slug: `authored-post-user-create-${runId}`,
          authors: [otherPerson.id],
          content: buildMinimalRichText(),
          _status: 'draft',
        },
      })

      userCreatedPostId = createdByUser.id

      const createdPostAuthorIDs = (createdByUser.authors || [])
        .map((author) => normalizeRelationshipID(author as number | { id: number }))
        .filter((id): id is number => id !== null)

      expect(createdPostAuthorIDs).toContain(authorPersonId)
      expect(createdPostAuthorIDs).toContain(otherPerson.id)

      const updatedUserCreatedPost = await payload.update({
        collection: 'posts',
        id: createdByUser.id,
        data: {
          excerpt: `Updated own created post ${runId}`,
        },
        user: users.user,
        overrideAccess: false,
        context: { disableRevalidate: true },
      })

      expect(updatedUserCreatedPost.excerpt).toBe(`Updated own created post ${runId}`)

      const updatedAuthors = await payload.update({
        collection: 'posts',
        id: createdByUser.id,
        data: {
          authors: [otherPerson.id],
        },
        user: users.user,
        overrideAccess: false,
        context: { disableRevalidate: true },
      })

      const updatedAuthorIDs = (updatedAuthors.authors || [])
        .map((author) => normalizeRelationshipID(author as number | { id: number }))
        .filter((id): id is number => id !== null)

      expect(updatedAuthorIDs).toContain(authorPersonId)
      expect(updatedAuthorIDs).toContain(otherPerson.id)

      const updatedOwnPost = await payload.update({
        collection: 'posts',
        id: postByA.id,
        data: {
          excerpt: `Updated by author ${runId}`,
        },
        user: users.user,
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
          user: users.user,
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
        user: users.admin,
        overrideAccess: false,
        context: { disableRevalidate: true },
      })

      const adminUpdatedB = await payload.update({
        collection: 'posts',
        id: postByB.id,
        data: {
          excerpt: `Admin updated B ${runId}`,
        },
        user: users.admin,
        overrideAccess: false,
        context: { disableRevalidate: true },
      })

      expect(adminUpdatedA.excerpt).toBe(`Admin updated A ${runId}`)
      expect(adminUpdatedB.excerpt).toBe(`Admin updated B ${runId}`)
    } finally {
      if (userCreatedPostId) {
        await payload.delete({
          collection: 'posts',
          id: userCreatedPostId,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }

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

      if (otherPersonId) {
        await payload.delete({
          collection: 'people',
          id: otherPersonId,
          overrideAccess: true,
        })
      }

      if (authorPersonWasCreated && authorPersonId) {
        await payload.delete({
          collection: 'people',
          id: authorPersonId,
          overrideAccess: true,
        })
      }
    }
  }, 60_000)
})
