import { beforeEach, describe, expect, it, vi } from 'vitest'

import { revalidateActivities } from '@/collections/Activities/hooks/revalidateActivities'
import { revalidateNews } from '@/collections/News/hooks/revalidateNews'
import { revalidateResearch } from '@/collections/Research/hooks/revalidateResearch'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

import { revalidatePath, revalidateTag } from 'next/cache'

const buildPayload = () =>
  ({
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
    },
  }) as any

describe('Revalidate hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips news revalidation for draft-to-draft updates', () => {
    revalidateNews({
      doc: { _status: 'draft', slug: 'draft-news' },
      previousDoc: { _status: 'draft', slug: 'draft-news' },
      req: { payload: buildPayload(), context: {} },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('skips research revalidation for draft-to-draft updates', () => {
    revalidateResearch({
      doc: { _status: 'draft', slug: 'draft-lab' },
      previousDoc: { _status: 'draft', slug: 'draft-lab' },
      req: { payload: buildPayload(), context: {} },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('revalidates current news path and shared caches for published docs', () => {
    revalidateNews({
      doc: { _status: 'published', slug: 'release' },
      previousDoc: { _status: 'draft', slug: 'release' },
      req: { payload: buildPayload(), context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/news')
    expect(revalidatePath).toHaveBeenCalledWith('/news/release')
    expect(revalidateTag).toHaveBeenCalledWith('site-sitemap')
  })

  it('revalidates conference list and detail paths for published conference docs', () => {
    revalidateActivities({
      doc: { _status: 'published', activityType: 'conference', slug: 'iclr-2026' },
      previousDoc: { _status: 'draft', activityType: 'conference', slug: 'iclr-2026' },
      req: { payload: buildPayload(), context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/conferences')
    expect(revalidatePath).toHaveBeenCalledWith('/conferences/iclr-2026')
    expect(revalidateTag).toHaveBeenCalledWith('site-sitemap')
  })
})
