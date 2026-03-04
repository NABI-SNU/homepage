import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ensureSymposiumExistsBeforeChange,
  ensureSymposiumExistsBeforeDelete,
} from '@/collections/Activities/hooks/ensureSymposiumExists'

describe('activities symposium guard hooks', () => {
  const find = vi.fn()
  const findByID = vi.fn()

  const req = {
    payload: {
      find,
      findByID,
    },
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks changing the last symposium to conference', async () => {
    find.mockResolvedValueOnce({ totalDocs: 1 })

    await expect(
      ensureSymposiumExistsBeforeChange({
        operation: 'update',
        originalDoc: { activityType: 'symposium' },
        data: {
          activityType: 'conference',
        },
        req,
      } as any),
    ).rejects.toThrow('At least one symposium entry must always exist.')
  })

  it('allows changing symposium when another symposium exists', async () => {
    find.mockResolvedValueOnce({ totalDocs: 2 })

    const data = await ensureSymposiumExistsBeforeChange({
      operation: 'update',
      originalDoc: { activityType: 'symposium' },
      data: {
        activityType: 'conference',
      },
      req,
    } as any)

    expect(data).toEqual({ activityType: 'conference' })
  })

  it('blocks deleting the last symposium', async () => {
    findByID.mockResolvedValueOnce({ activityType: 'symposium' })
    find.mockResolvedValueOnce({ totalDocs: 1 })

    await expect(
      ensureSymposiumExistsBeforeDelete({
        id: 1,
        req,
      } as any),
    ).rejects.toThrow('Cannot delete the last symposium entry.')
  })

  it('allows deleting conference docs', async () => {
    findByID.mockResolvedValueOnce({ activityType: 'conference' })

    await expect(
      ensureSymposiumExistsBeforeDelete({
        id: 1,
        req,
      } as any),
    ).resolves.toBeUndefined()

    expect(find).not.toHaveBeenCalled()
  })
})
