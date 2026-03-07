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

    expect(result.actions.postCreateURL).toBeUndefined()
    expect(result.actions.wikiCreateURL).toBe('/admin/collections/wiki/create')
    expect(result.recentPosts).toEqual([])
    expect(result.recentWiki).toEqual([])
    expect(payload.find).toHaveBeenCalledTimes(1)
  })
})
