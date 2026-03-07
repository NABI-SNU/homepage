import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { requireTestAccountUsers, userTestAccount } from './testAccounts'

type SeededWikiScenario = {
  ownerEmail: string
  ownerPassword: string
  ownerWikiID: number
  ownerWikiSlug: string
  otherWikiID: number
  otherWikiSlug: string
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
            text: 'Owned wiki content',
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

export async function seedOwnedWikiScenario(): Promise<SeededWikiScenario> {
  const payload = await getPayload({ config })
  const { admin, user } = await requireTestAccountUsers(payload)
  const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

  const ownerWiki = await payload.create({
    collection: 'wiki',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: `Owner Wiki ${runID}`,
      slug: `owner-wiki-${runID}`,
      content: buildMinimalRichText(),
      createdBy: user.id,
      _status: 'published',
    },
  })

  const otherWiki = await payload.create({
    collection: 'wiki',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: `Other Wiki ${runID}`,
      slug: `other-wiki-${runID}`,
      content: buildMinimalRichText(),
      createdBy: admin.id,
      _status: 'published',
    },
  })

  return {
    ownerEmail: userTestAccount.email,
    ownerPassword: userTestAccount.password,
    ownerWikiID: ownerWiki.id,
    ownerWikiSlug: ownerWiki.slug as string,
    otherWikiID: otherWiki.id,
    otherWikiSlug: otherWiki.slug as string,
  }
}

export async function cleanupOwnedWikiScenario(scenario: SeededWikiScenario): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'wiki',
    id: scenario.ownerWikiID,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })

  await payload.delete({
    collection: 'wiki',
    id: scenario.otherWikiID,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
}

export type { SeededWikiScenario }
