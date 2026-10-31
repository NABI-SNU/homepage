import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { requireTestAccountUsers } from '../helpers/testAccounts'

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

const toAuthorIDs = (authors: unknown): number[] =>
  ((authors as Array<number | { id: number }> | null | undefined) || [])
    .map((author) => normalizeRelationshipID(author))
    .filter((id): id is number => id !== null)

/**
 * `posts.authors` holds user ids: every user is their own author profile. Non-admin writes are
 * forced to include the requester's own id (ensurePostAuthors), and non-admins may only update
 * posts they author.
 */
describe('Posts Access', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    users = await requireTestAccountUsers(payload)
  })

  it('allows own-post edits, blocks cross-user edits, and allows admins to edit all posts', async () => {
    const authorUserId = users.user.id
    let otherUserId: number | null = null
    let postAId: number | null = null
    let postBId: number | null = null
    let userCreatedPostId: number | null = null

    try {
      // A throwaway profile-only member (no login) to author the "other" post.
      const otherUser = await payload.create({
        collection: 'users',
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          name: `Post Access Other ${runId}`,
          slug: `post-access-other-${runId}`,
          contactEmail: `post-access-other-${runId}@example.com`,
          years: [2026],
          memberType: 'alumni',
          isApproved: false,
          emailVerified: false,
        } as never,
      })

      otherUserId = otherUser.id

      const [postByA, postByB] = await Promise.all([
        payload.create({
          collection: 'posts',
          overrideAccess: true,
          context: { disableRevalidate: true },
          data: {
            title: `Authored Post A ${runId}`,
            slug: `authored-post-a-${runId}`,
            authors: [authorUserId],
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
            authors: [otherUser.id],
            content: buildMinimalRichText(),
            _status: 'draft',
          },
        }),
      ])

      postAId = postByA.id
      postBId = postByB.id

      // A non-admin creating a post is always added as an author, whatever they submit.
      const createdByUser = await payload.create({
        collection: 'posts',
        user: users.user,
        overrideAccess: false,
        context: { disableRevalidate: true },
        data: {
          title: `Authored Post User Create ${runId}`,
          slug: `authored-post-user-create-${runId}`,
          authors: [otherUser.id],
          content: buildMinimalRichText(),
          _status: 'draft',
        },
      })

      userCreatedPostId = createdByUser.id

      const createdPostAuthorIDs = toAuthorIDs(createdByUser.authors)
      expect(createdPostAuthorIDs).toContain(authorUserId)
      expect(createdPostAuthorIDs).toContain(otherUser.id)

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

      // A non-admin cannot remove themselves from the author list.
      const updatedAuthors = await payload.update({
        collection: 'posts',
        id: createdByUser.id,
        data: {
          authors: [otherUser.id],
        },
        user: users.user,
        overrideAccess: false,
        context: { disableRevalidate: true },
      })

      const updatedAuthorIDs = toAuthorIDs(updatedAuthors.authors)
      expect(updatedAuthorIDs).toContain(authorUserId)
      expect(updatedAuthorIDs).toContain(otherUser.id)

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

      // Drafts authored by someone else are neither readable nor editable.
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

      const readableDrafts = await payload.find({
        collection: 'posts',
        depth: 0,
        draft: true,
        limit: 10,
        pagination: false,
        user: users.user,
        overrideAccess: false,
        where: {
          id: { in: [postByA.id, postByB.id] },
        },
      })
      expect(readableDrafts.docs.map((doc) => doc.id)).toEqual([postByA.id])

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

      // Admin writes are not forced to include the admin as an author.
      expect(toAuthorIDs(adminUpdatedB.authors)).toEqual([otherUser.id])
    } finally {
      for (const id of [userCreatedPostId, postAId, postBId]) {
        if (!id) continue
        await payload.delete({
          collection: 'posts',
          id,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }

      if (otherUserId) {
        await payload.delete({
          collection: 'users',
          id: otherUserId,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }
    }
  }, 60_000)
})
