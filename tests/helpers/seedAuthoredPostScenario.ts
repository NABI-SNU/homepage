import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { requireTestAccountUsers, userTestAccount } from './testAccounts'

type SeededScenario = {
  authorEmail: string
  authorPassword: string
  authorPostID: number
  authorPostSlug: string
  authorPersonID: number
  authorPersonWasCreated: boolean
  otherPostID: number
  otherPostSlug: string
  otherPersonID: number
}

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

export async function seedAuthoredPostScenario(): Promise<SeededScenario> {
  const payload = await getPayload({ config })
  const { user: authorUser } = await requireTestAccountUsers(payload)
  const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

  let authorPerson = (
    await payload.find({
      collection: 'people',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        user: {
          equals: authorUser.id,
        },
      },
    })
  ).docs[0]

  let authorPersonWasCreated = false

  if (!authorPerson) {
    authorPersonWasCreated = true
    authorPerson = await payload.create({
      collection: 'people',
      overrideAccess: true,
      context: { disableRevalidate: true },
      data: {
        name: userTestAccount.name,
        slug: `post-author-person-${runID}`,
        email: userTestAccount.email,
        joinedYear: 2026,
        memberType: 'user',
        user: authorUser.id,
      },
    })
  }

  const otherPerson = await payload.create({
    collection: 'people',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      name: `Post Other ${runID}`,
      slug: `post-other-person-${runID}`,
      email: `post-other-${runID}@example.com`,
      joinedYear: 2026,
      memberType: 'alumni',
      user: null,
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
    authorEmail: userTestAccount.email,
    authorPassword: userTestAccount.password,
    authorPostID: authorPost.id,
    authorPostSlug: authorPost.slug as string,
    authorPersonID: authorPerson.id,
    authorPersonWasCreated,
    otherPostID: otherPost.id,
    otherPostSlug: otherPost.slug as string,
    otherPersonID: otherPerson.id,
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
    id: scenario.otherPersonID,
    overrideAccess: true,
  })

  if (scenario.authorPersonWasCreated) {
    await payload.delete({
      collection: 'people',
      id: scenario.authorPersonID,
      overrideAccess: true,
    })
  }
}

export type { SeededScenario }
