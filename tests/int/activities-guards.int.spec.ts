import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ensureSymposiumExistsBeforeChange,
  ensureSymposiumExistsBeforeDelete,
} from '@/collections/Activities/hooks/ensureSymposiumExists'

describe('activities symposium guard hooks', () => {
  type EnsureChangeArgs = Parameters<typeof ensureSymposiumExistsBeforeChange>[0]
  type EnsureDeleteArgs = Parameters<typeof ensureSymposiumExistsBeforeDelete>[0]
  type MockReq = EnsureChangeArgs['req']

  const find = vi.fn()
  const findByID = vi.fn()

  const req = {
    payload: {
      find,
      findByID,
    },
  } as unknown as MockReq

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
      } as unknown as EnsureChangeArgs),
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
    } as unknown as EnsureChangeArgs)

    expect(data).toEqual({ activityType: 'conference' })
  })

  it('blocks deleting the last symposium', async () => {
    findByID.mockResolvedValueOnce({ activityType: 'symposium' })
    find.mockResolvedValueOnce({ totalDocs: 1 })

    await expect(
      ensureSymposiumExistsBeforeDelete({
        id: 1,
        req,
      } as unknown as EnsureDeleteArgs),
    ).rejects.toThrow('Cannot delete the last symposium entry.')
  })

  it('allows deleting conference docs', async () => {
    findByID.mockResolvedValueOnce({ activityType: 'conference' })

    await expect(
      ensureSymposiumExistsBeforeDelete({
        id: 1,
        req,
      } as unknown as EnsureDeleteArgs),
    ).resolves.toBeUndefined()

    expect(find).not.toHaveBeenCalled()
  })
})
