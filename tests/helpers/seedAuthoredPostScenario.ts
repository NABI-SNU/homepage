import { Pool } from 'pg'
import { getPayload } from 'payload'

import { auth } from '../../src/auth/betterAuth'
import config from '../../src/payload.config.js'

type SeededScenario = {
  authorEmail: string
  authorPassword: string
  authorPostID: number
  authorPostSlug: string
  authorUserID: number
  authorPersonID: number
  otherPostID: number
  otherPostSlug: string
  otherUserID: number
  otherPersonID: number
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

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

const deleteBetterAuthUserByEmail = async (email: string): Promise<void> => {
  const safeQuery = async (statement: string) => {
    try {
      await pool.query(statement, [email])
    } catch {
      // BetterAuth tables may not exist until migrations run.
    }
  }

  await safeQuery('DELETE FROM "session" WHERE "userId" IN (SELECT "id" FROM "user" WHERE "email" = $1)')
  await safeQuery('DELETE FROM "account" WHERE "userId" IN (SELECT "id" FROM "user" WHERE "email" = $1)')
  await safeQuery('DELETE FROM "verification" WHERE "identifier" = $1')
  await safeQuery('DELETE FROM "user" WHERE "email" = $1')
}

export async function seedAuthoredPostScenario(): Promise<SeededScenario> {
  const payload = await getPayload({ config })
  const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

  const authorEmail = `post-author-${runID}@example.com`
  const otherEmail = `post-other-${runID}@example.com`
  const authorPassword = 'test-password-1234'

  await deleteBetterAuthUserByEmail(authorEmail)

  await payload.delete({
    collection: 'posts',
    where: {
      slug: {
        in: [`post-author-${runID}`, `post-other-${runID}`],
      },
    },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })

  await payload.delete({
    collection: 'people',
    where: {
      email: {
        in: [authorEmail, otherEmail],
      },
    },
    overrideAccess: true,
  })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        in: [authorEmail, otherEmail],
      },
    },
    overrideAccess: true,
  })

  await auth.api.signUpEmail({
    body: {
      name: `Post Author ${runID}`,
      email: authorEmail,
      password: authorPassword,
    },
  })

  const authorUsers = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: authorEmail,
      },
    },
  })

  const authorUser = authorUsers.docs[0]
  if (!authorUser) throw new Error('Failed to seed author payload user')

  const approvedAuthorUser = await payload.update({
    collection: 'users',
    id: authorUser.id,
    data: {
      isApproved: true,
      roles: 'user',
      name: `Post Author ${runID}`,
    },
    overrideAccess: true,
  })

  let authorPerson = (
    await payload.find({
      collection: 'people',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        user: {
          equals: approvedAuthorUser.id,
        },
      },
    })
  ).docs[0]

  if (!authorPerson) {
    authorPerson = await payload.create({
      collection: 'people',
      overrideAccess: true,
      context: { disableRevalidate: true },
      data: {
        name: `Post Author ${runID}`,
        slug: `post-author-person-${runID}`,
        email: authorEmail,
        joinedYear: 2026,
        memberType: 'user',
        user: approvedAuthorUser.id,
      },
    })
  }

  const otherUser = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      email: otherEmail,
      name: `Post Other ${runID}`,
      roles: 'user',
      isApproved: true,
      betterAuthUserId: `better-auth-other-${runID}`,
    },
  })

  const otherPerson = await payload.create({
    collection: 'people',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      name: `Post Other ${runID}`,
      slug: `post-other-person-${runID}`,
      email: otherEmail,
      joinedYear: 2026,
      memberType: 'user',
      user: otherUser.id,
    },
  })

  const authorPost = await payload.create({
    collection: 'posts',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: `Author Post ${runID}`,
      slug: `post-author-${runID}`,
      authors: [authorPerson.id],
      content: buildMinimalRichText() as any,
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
      authors: [otherPerson.id],
      content: buildMinimalRichText() as any,
      _status: 'published',
    },
  })

  return {
    authorEmail,
    authorPassword,
    authorPostID: authorPost.id,
    authorPostSlug: authorPost.slug as string,
    authorPersonID: authorPerson.id,
    authorUserID: approvedAuthorUser.id,
    otherPostID: otherPost.id,
    otherPostSlug: otherPost.slug as string,
    otherPersonID: otherPerson.id,
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

  await payload.delete({
    collection: 'people',
    id: scenario.authorPersonID,
    overrideAccess: true,
  })

  await payload.delete({
    collection: 'people',
    id: scenario.otherPersonID,
    overrideAccess: true,
  })

  await payload.delete({
    collection: 'users',
    id: scenario.authorUserID,
    overrideAccess: true,
  })

  await payload.delete({
    collection: 'users',
    id: scenario.otherUserID,
    overrideAccess: true,
  })

  await deleteBetterAuthUserByEmail(scenario.authorEmail)
}

export type { SeededScenario }

