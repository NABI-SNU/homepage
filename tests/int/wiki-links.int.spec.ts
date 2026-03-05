import { describe, expect, it, vi } from 'vitest'

import { resolveOutgoingWikiLinks } from '@/collections/Wiki/hooks/resolveLinks'
import { findWikiLinkMatches, parseWikiLinks } from '@/utilities/wikiLinks'

describe('wiki link parser', () => {
  it('parses wiki links with and without aliases', () => {
    const input = 'Related: [[Memory Models]] and [[Hebbian Learning|Hebbian]].'
    const parsed = parseWikiLinks(input)

    expect(parsed).toEqual([
      { target: 'Memory Models', label: 'Memory Models' },
      { target: 'Hebbian Learning', label: 'Hebbian' },
    ])
  })

  it('keeps link positions for inline replacement', () => {
    const input = 'A [[B]] C [[D|E]]'
    const matches = findWikiLinkMatches(input)

    expect(matches).toHaveLength(2)
    expect(matches[0]).toMatchObject({ start: 2, target: 'B', label: 'B' })
    expect(matches[1]).toMatchObject({ target: 'D', label: 'E' })
  })
})

describe('resolveOutgoingWikiLinks hook', () => {
  it('resolves rich and wikilinks, dedupes, and captures unresolved targets', async () => {
    const find = vi.fn(async () => ({
      docs: [
        { id: 1, slug: 'current-note', title: 'Current Note', aliases: ['Current'] },
        { id: 2, slug: 'memory-models', title: 'Memory Models', aliases: ['Working Memory'] },
      ],
    }))

    const data = {
      content: {
        root: {
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'See [[Memory Models]] and [[Unknown Target]] and [[Current Note]].',
                },
              ],
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'link',
                  fields: {
                    doc: { relationTo: 'wiki', value: 2 },
                    linkType: 'internal',
                  },
                  children: [{ type: 'text', text: 'Memory Models' }],
                },
              ],
            },
          ],
          type: 'root',
        },
      },
      slug: 'current-note',
    }

    const req = {
      payload: {
        find,
      },
    }

    const result = await resolveOutgoingWikiLinks({
      data,
      operation: 'update',
      originalDoc: { id: 1, slug: 'current-note' },
      req,
    } as never)

    expect(result.outgoingLinks).toEqual([2])
    expect(result.unresolvedWikiLinks).toEqual([{ target: 'Unknown Target' }])
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'wiki',
        overrideAccess: false,
        req,
      }),
    )
  })
})

