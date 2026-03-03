import { describe, expect, it, vi } from 'vitest'

import { syncResearchTagsFromPerson } from '@/collections/People/hooks/syncResearchTags'

describe('syncResearchTagsFromPerson', () => {
  it('does nothing when normalized research tags are unchanged', async () => {
    const payload = {
      create: vi.fn(),
      find: vi.fn(),
      update: vi.fn(),
    }

    const doc = {
      id: 1,
      research: ['AI, Neuroscience'],
    }

    const previousDoc = {
      id: 1,
      research: ['neuroscience', 'ai'],
    }

    const result = await syncResearchTagsFromPerson({
      doc,
      previousDoc,
      req: {
        payload,
        context: {},
      },
    } as any)

    expect(result).toBe(doc)
    expect(payload.find).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('looks up tags in batch instead of per-tag find calls', async () => {
    const payload = {
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({
          docs: [
            { id: 11, slug: 'ai' },
            { id: 12, slug: 'machine-learning' },
            { id: 13, slug: 'vision' },
          ],
        })
        .mockResolvedValueOnce({ docs: [] }),
    }

    await syncResearchTagsFromPerson({
      doc: {
        id: 99,
        research: ['AI', 'Machine Learning', 'Vision'],
      },
      previousDoc: {
        id: 99,
        research: [],
      },
      req: {
        payload,
        context: {},
      },
    } as any)

    const tagFindCalls = payload.find.mock.calls.filter(
      ([args]) => (args as { collection?: string }).collection === 'tags',
    )

    expect(tagFindCalls).toHaveLength(2)
    expect((tagFindCalls[0]?.[0] as any).where.slug.in).toEqual(['ai', 'machine-learning', 'vision'])
    expect(payload.create).toHaveBeenCalledTimes(3)
  })
})
