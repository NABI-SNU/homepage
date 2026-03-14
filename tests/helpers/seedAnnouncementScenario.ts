import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

type SeededAnnouncementScenario = {
  announcementID: number
  announcementSlug: string
  announcementTitle: string
}

const buildAnnouncementRichText = (): DefaultTypedEditorState => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        tag: 'h2',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'Schedule update',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This standalone announcement verifies archive and detail rendering.',
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

export async function seedAnnouncementScenario(): Promise<SeededAnnouncementScenario> {
  const payload = await getPayload({ config })
  const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

  const announcement = await payload.create({
    collection: 'announcements',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: `Announcement Demo ${runID}`,
      slug: `announcement-demo-${runID}`,
      description: 'Standalone announcement entry for frontend coverage.',
      publishedAt: new Date().toISOString(),
      content: buildAnnouncementRichText(),
      _status: 'published',
    },
  })

  return {
    announcementID: announcement.id,
    announcementSlug: announcement.slug as string,
    announcementTitle: announcement.title,
  }
}

export async function cleanupAnnouncementScenario(
  scenario: SeededAnnouncementScenario,
): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'announcements',
    id: scenario.announcementID,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
}

export type { SeededAnnouncementScenario }
