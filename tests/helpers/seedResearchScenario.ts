import fs from 'fs/promises'
import path from 'path'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

type SeededResearchScenario = {
  notebookID: number
  researchID: number
  researchSlug: string
  researchTitle: string
}

const buildOverviewRichText = (): DefaultTypedEditorState => ({
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
            text: 'Overview',
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
            text: 'This entry verifies the MyST-style notebook reading experience.',
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

export async function seedResearchScenario(): Promise<SeededResearchScenario> {
  const payload = await getPayload({ config })
  const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`
  const notebookPath = path.resolve(process.cwd(), 'tests/fixtures/research-demo.ipynb')
  const notebookBuffer = await fs.readFile(notebookPath)

  const notebook = await payload.create({
    collection: 'notebooks',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {},
    file: {
      data: notebookBuffer,
      mimetype: 'application/x-ipynb+json',
      name: `research-demo-${runID}.ipynb`,
      size: notebookBuffer.byteLength,
    },
  })

  const research = await payload.create({
    collection: 'research',
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: `Research Demo ${runID}`,
      slug: `research-demo-${runID}`,
      description: 'Notebook-backed research entry for labs e2e coverage.',
      content: buildOverviewRichText(),
      notebook: notebook.id,
      _status: 'published',
    },
  })

  return {
    notebookID: notebook.id,
    researchID: research.id,
    researchSlug: research.slug as string,
    researchTitle: research.title,
  }
}

export async function cleanupResearchScenario(scenario: SeededResearchScenario): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'research',
    id: scenario.researchID,
    overrideAccess: true,
    context: { disableRevalidate: true },
  })

  await payload.delete({
    collection: 'notebooks',
    id: scenario.notebookID,
    overrideAccess: true,
  })
}

export type { SeededResearchScenario }
