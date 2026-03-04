import type { Payload } from 'payload'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

const defaultSymposiumContent: DefaultTypedEditorState = {
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
            text: 'About NABI',
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
            text: 'NABI (Natural and Artificial Brain Intelligence) is a collaborative group studying computational neuroscience and NeuroAI.',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
      },
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
            text: 'Symposium Theme',
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
            text: 'The first annual symposium theme is "Memory in Context," with a focus on hippocampal computation and contextual memory.',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
      },
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
            text: 'Program',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
      {
        type: 'list',
        listType: 'bullet',
        start: 1,
        tag: 'ul',
        children: [
          {
            type: 'listitem',
            checked: false,
            value: 1,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 1,
                    mode: 'normal',
                    style: '',
                    text: 'Section 1: Topic Review',
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
          {
            type: 'listitem',
            checked: false,
            value: 2,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 1,
                    mode: 'normal',
                    style: '',
                    text: 'Section 2: Methods Deep Dive (Interactive Workshop)',
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
          {
            type: 'listitem',
            checked: false,
            value: 3,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 1,
                    mode: 'normal',
                    style: '',
                    text: 'Section 3: Research Proposal',
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
            text: 'For inquiries: admin@nabi.org',
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
}

export const ensureDefaultSymposiumActivity = async (payload: Payload): Promise<void> => {
  try {
    const existingSymposium = await payload.find({
      collection: 'activities',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        activityType: {
          equals: 'symposium',
        },
      },
    })

    if (existingSymposium.docs.length > 0) return

    await payload.create({
      collection: 'activities',
      overrideAccess: true,
      data: {
        title: 'Memory in Context',
        description: '제1회 NABI 정기 심포지엄 — 해마와 맥락적 기억의 계산 모델링',
        activityType: 'symposium',
        date: '2026-02-24T09:00:00.000Z',
        location: '서울대학교 의학도서관 2층 우봉홀',
        content: defaultSymposiumContent,
        slug: 'symposium-2026-memory-in-context',
        _status: 'published',
        meta: {
          title: 'Symposium 2026: Memory in Context',
          description:
            'NABI annual symposium on contextual memory, hippocampal computation, and interactive methods sessions.',
        },
      },
    })

    payload.logger.info('Seeded default symposium activity')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const cause =
      error && typeof error === 'object' && 'cause' in error
        ? (error as { cause?: unknown }).cause
        : null
    const causeMessage = cause instanceof Error ? cause.message : String(cause || '')
    const causeCode =
      cause && typeof cause === 'object' && 'code' in cause
        ? (cause as { code?: string }).code
        : undefined
    const errorCode =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : undefined
    const missingActivitiesTable =
      errorCode === '42P01' ||
      causeCode === '42P01' ||
      ([message, causeMessage].join(' ').includes('activities') &&
        [message, causeMessage].join(' ').includes('does not exist'))

    if (missingActivitiesTable) {
      payload.logger.warn('Skipping symposium seed: activities table is not available yet.')
      return
    }

    throw error
  }
}
