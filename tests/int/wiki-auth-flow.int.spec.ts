import { describe, expect, it } from 'vitest'

import { Wiki } from '@/collections/Wiki'
import { assignWikiOwner } from '@/collections/Wiki/hooks/assignOwner'

describe('wiki auth flow', () => {
  it('allows authenticated members to edit and limits deletion to admins', async () => {
    const anonymousUpdate = await Wiki.access?.update?.({
      req: { user: null },
    } as never)
    expect(anonymousUpdate).toBe(false)

    const memberUpdate = await Wiki.access?.update?.({
      req: { user: { id: 42, roles: 'user' } },
    } as never)
    expect(memberUpdate).toBe(true)

    const adminDelete = await Wiki.access?.delete?.({
      req: { user: { id: 1, roles: 'admin' } },
    } as never)
    expect(adminDelete).toBe(true)

    const memberDelete = await Wiki.access?.delete?.({
      req: { user: { id: 42, roles: 'user' } },
    } as never)
    expect(memberDelete).toBe(false)
  })

  it('assigns original creator on create and preserves it for non-admin updates', async () => {
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
