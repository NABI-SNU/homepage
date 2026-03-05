import { describe, expect, it, vi } from 'vitest'

import type { Search } from '@/payload-types'
import { mapSearchResultsToCardDocs } from '@/search/mapSearchResultsToCardDocs'

const now = new Date().toISOString()

const buildSearchDoc = (overrides: Partial<Search>): Search => {
  return {
    id: 1,
    createdAt: now,
    updatedAt: now,
    doc: {
      relationTo: 'posts',
      value: 1,
    },
    ...overrides,
  }
}

describe('mapSearchResultsToCardDocs', () => {
  it('maps news search results using the same preview image source as news cards', async () => {
    const results = [
      buildSearchDoc({
        id: 101,
        title: 'News result',
        slug: 'news-result',
        doc: {
          relationTo: 'news',
          value: 42,
        },
        meta: {
          title: 'News result',
          description: 'News description',
          image: null,
        },
      }),
    ]

    const find = vi.fn(async (args: Record<string, unknown>) => {
      if (args.collection === 'news') {
        return {
          docs: [
            {
              id: 42,
              image: 700,
              content: {
                root: { type: 'root', children: [] },
              },
            },
          ],
        }
      }

      if (args.collection === 'media') {
        return {
          docs: [
            {
              id: 700,
              url: '/media/news-preview.jpg',
            },
          ],
        }
      }

      throw new Error(`Unexpected collection: ${String(args.collection)}`)
    })

    const mapped = await mapSearchResultsToCardDocs({
      payload: { find },
      results,
    })

    expect(mapped).toHaveLength(1)
    expect(mapped[0]?.relationTo).toBe('news')
    expect(mapped[0]?.meta?.image).toMatchObject({ id: 700 })
    expect(mapped[0]?.previewImage).toBeNull()
  })

  it('maps post search results to posts cards and resolves post meta image', async () => {
    const results = [
      buildSearchDoc({
        id: 202,
        title: 'Post result',
        slug: 'post-result',
        doc: {
          relationTo: 'posts',
          value: 11,
        },
        meta: {
          title: 'Post result',
          description: 'Post description',
          image: 500,
        },
      }),
    ]

    const find = vi.fn(async (args: Record<string, unknown>) => {
      if (args.collection === 'media') {
        return {
          docs: [
            {
              id: 500,
              url: '/media/post-preview.jpg',
            },
          ],
        }
      }

      if (args.collection === 'news') {
        return { docs: [] }
      }

      throw new Error(`Unexpected collection: ${String(args.collection)}`)
    })

    const mapped = await mapSearchResultsToCardDocs({
      payload: { find },
      results,
    })

    expect(mapped).toHaveLength(1)
    expect(mapped[0]?.relationTo).toBe('posts')
    expect(mapped[0]?.meta?.image).toMatchObject({ id: 500 })
    expect(mapped[0]?.previewImage).toBeNull()
    expect(
      find.mock.calls.some(
        ([callArgs]) => (callArgs as Record<string, unknown>).collection === 'news',
      ),
    ).toBe(false)
  })

  it('maps wiki search results to wiki cards', async () => {
    const results = [
      buildSearchDoc({
        id: 303,
        title: 'Wiki result',
        slug: 'memory-models',
        doc: {
          relationTo: 'wiki',
          value: 64,
        },
        meta: {
          title: 'Memory Models',
          description: 'Linked wiki summary',
          image: null,
        },
      }),
    ]

    const find = vi.fn(async (args: Record<string, unknown>) => {
      if (args.collection === 'news') return { docs: [] }
      if (args.collection === 'media') return { docs: [] }
      throw new Error(`Unexpected collection: ${String(args.collection)}`)
    })

    const mapped = await mapSearchResultsToCardDocs({
      payload: { find },
      results,
    })

    expect(mapped).toHaveLength(1)
    expect(mapped[0]?.relationTo).toBe('wiki')
    expect(mapped[0]?.slug).toBe('memory-models')
    expect(mapped[0]?.meta?.description).toBe('Linked wiki summary')
  })
})
