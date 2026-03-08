import { describe, expect, it, vi } from 'vitest'

import { publishedResearchNotebook } from '@/access/publishedResearchNotebook'

describe('publishedResearchNotebook', () => {
  it('allows reading a published notebook when access is checked by filename', async () => {
    const find = vi.fn().mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'research') {
        return Promise.resolve({
          docs: [
            {
              notebook: {
                id: 7,
              },
            },
          ],
        })
      }

      if (collection === 'notebooks') {
        return Promise.resolve({
          docs: [
            {
              id: 7,
            },
          ],
        })
      }

      throw new Error(`Unexpected collection: ${collection}`)
    })

    const allowed = await publishedResearchNotebook({
      id: 'research-demo.ipynb',
      req: {
        payload: {
          find,
        },
        user: null,
      } as never,
    } as never)

    expect(allowed).toBe(true)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'research',
        overrideAccess: true,
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'notebooks',
        overrideAccess: true,
        where: {
          filename: {
            equals: 'research-demo.ipynb',
          },
        },
      }),
    )
  })
})
