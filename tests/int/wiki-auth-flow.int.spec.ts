import { describe, expect, it } from 'vitest'

import { adminOrWikiOwner } from '@/access/adminOrWikiOwner'
import { assignWikiOwner } from '@/collections/Wiki/hooks/assignOwner'

describe('wiki auth flow', () => {
  it('allows admins and scopes non-admin users to their own pages', () => {
    const anonymousAccess = adminOrWikiOwner({
      req: { user: null },
    } as never)
    expect(anonymousAccess).toBe(false)

    const adminAccess = adminOrWikiOwner({
      req: { user: { id: 1, roles: 'admin' } },
    } as never)
    expect(adminAccess).toBe(true)

    const userAccess = adminOrWikiOwner({
      req: { user: { id: 42, roles: 'user' } },
    } as never)
    expect(userAccess).toEqual({
      createdBy: {
        equals: 42,
      },
    })
  })

  it('assigns owner on create and prevents owner hijacking on non-admin update', async () => {
    const created = await assignWikiOwner({
      data: {
        title: 'My Note',
      },
      operation: 'create',
      req: {
        user: {
          id: 10,
          roles: 'user',
        },
      },
    } as never)

    expect((created as { createdBy?: number }).createdBy).toBe(10)

    const updatedByUser = await assignWikiOwner({
      data: {
        createdBy: 999,
      },
      operation: 'update',
      originalDoc: {
        createdBy: 10,
      },
      req: {
        user: {
          id: 10,
          roles: 'user',
        },
      },
    } as never)

    expect((updatedByUser as { createdBy?: number }).createdBy).toBe(10)
  })
})

