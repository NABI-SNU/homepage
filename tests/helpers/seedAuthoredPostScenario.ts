import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { requireTestAccountUsers, userTestAccount } from './testAccounts'

/**
 * Users are their own author profiles now: `posts.authors` holds user ids. The shared test user
 * authors one post directly; a throwaway profile-only member (no login) authors the other.
 */
type SeededScenario = {
  authorEmail: string
  authorPassword: string
  authorPostID: number
  authorPostSlug: string
  authorUserID: number
  otherPostID: number
  otherPostSlug: string
  otherUserID: number
}

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
            text: 'E2E test content',
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

export async function seedAuthoredPostScenario(): Promise<SeededScenario> {
  const payload = await getPayload({ config })
  const { user: authorUser } = await requireTestAccountUsers(payload)
  const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

  // A listed member without a login: no `email`, only a public contact address.
  const otherUser = await payload.create({
    collection: 'users',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      name: `Post Other ${runID}`,
      slug: `post-other-user-${runID}`,
      contactEmail: `post-other-${runID}@example.com`,
      years: [2026],
      memberType: 'alumni',
      isApproved: false,
      emailVerified: false,
    } as never,
  })

  const authorPost = await payload.create({
    collection: 'posts',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: `Author Post ${runID}`,
      slug: `post-author-${runID}`,
      authors: [authorUser.id],
      content: buildMinimalRichText(),
      _status: 'published',
    },
  })

  const otherPost = await payload.create({
    collection: 'posts',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: `Other Post ${runID}`,
      slug: `post-other-${runID}`,
      authors: [otherUser.id],
      content: buildMinimalRichText(),
      _status: 'published',
    },
  })

  return {
    authorEmail: userTestAccount.email,
    authorPassword: userTestAccount.password,
    authorPostID: authorPost.id,
    authorPostSlug: authorPost.slug as string,
    authorUserID: authorUser.id,
    otherPostID: otherPost.id,
    otherPostSlug: otherPost.slug as string,
    otherUserID: otherUser.id,
  }
}

export async function cleanupAuthoredPostScenario(scenario: SeededScenario): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'posts',
    id: scenario.authorPostID,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })

  await payload.delete({
    collection: 'posts',
    id: scenario.otherPostID,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })

  // The shared test user is never deleted; only the throwaway member goes.
  await payload.delete({
    collection: 'users',
    id: scenario.otherUserID,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
}

export type { SeededScenario }
