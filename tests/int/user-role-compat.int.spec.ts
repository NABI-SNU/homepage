import { describe, expect, it } from 'vitest'

import { hasAdminRole } from '@/access/hasAdminRole'
import { syncUserRoleFields } from '@/collections/Users/hooks/syncUserRoleFields'

describe('user role compatibility', () => {
  it('mirrors legacy roles into canonical role fields', async () => {
    const data = await syncUserRoleFields({
      data: {
        roles: 'admin',
      },
    } as never)

    expect(data).toMatchObject({
      role: 'admin',
      roles: 'admin',
    })
  })

  it('treats canonical role as authoritative for admin checks', () => {
    expect(
      hasAdminRole({
        id: 1,
        role: 'admin',
        roles: 'user',
      } as never),
    ).toBe(true)
  })
})
