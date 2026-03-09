import { describe, expect, it, vi } from 'vitest'

import { getAccountDashboardData } from '@/utilities/accountAccess'

describe('account dashboard data', () => {
  it('omits post creation actions when no linked person exists', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [] }),
    }

    const result = await getAccountDashboardData({
      linkedPerson: null,
      payload: payload as never,
      permissions: {
        canAccessAdmin: true,
        canCreatePost: false,
        canCreateWiki: true,
        canPublishOwnPosts: false,
        canPublishOwnWiki: true,
      },
      responseHeaders: new Headers(),
      user: {
        id: 42,
        roles: 'user',
      } as never,
    })

    expect(result.actions.notionURL).toBe(
      'https://www.notion.so/Headquarters-314d4da6497980c08811f9b4b952006b?source=copy_link',
    )
    expect(result.actions.postCreateURL).toBeUndefined()
    expect(result.actions.wikiCreateURL).toBe('/admin/collections/wiki/create')
    expect(result.recentPosts).toEqual([])
    expect(result.recentWiki).toEqual([])
    expect(payload.find).toHaveBeenCalledTimes(1)
  })

  it('loads recent wiki items from the owner relation', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 7,
            slug: 'shared-note',
            title: 'Shared Note',
            updatedAt: '2026-03-08T00:00:00.000Z',
            _status: 'published',
          },
        ],
      }),
    }

    const result = await getAccountDashboardData({
      linkedPerson: null,
      payload: payload as never,
      permissions: {
        canAccessAdmin: true,
        canCreatePost: false,
        canCreateWiki: true,
        canPublishOwnPosts: false,
        canPublishOwnWiki: true,
      },
      responseHeaders: new Headers(),
      user: {
        id: 42,
        roles: 'user',
      } as never,
    })

    expect(payload.find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'wiki',
        where: {
          createdBy: {
            equals: 42,
          },
        },
      }),
    )
    expect(result.recentWiki).toEqual([
      expect.objectContaining({
        editURL: '/admin/collections/wiki/7',
        title: 'Shared Note',
        viewURL: '/wiki/shared-note',
      }),
    ])
  })
})
