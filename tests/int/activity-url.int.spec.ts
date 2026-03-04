import { describe, expect, it } from 'vitest'

import { getActivityPath, getActivityPathFromReferenceValue } from '@/utilities/activityURL'

describe('activity URL helpers', () => {
  it('returns symposium detail route for symposium activities', () => {
    expect(
      getActivityPath({
        activityType: 'symposium',
        slug: 'symposium-2026',
      }),
    ).toBe('/symposium/symposium-2026')
  })

  it('returns conference route for conference activities', () => {
    expect(
      getActivityPath({
        activityType: 'conference',
        slug: 'neurips-2026',
      }),
    ).toBe('/conferences/neurips-2026')
  })

  it('resolves reference object values', () => {
    expect(
      getActivityPathFromReferenceValue({
        activityType: 'conference',
        slug: 'cns-2026',
      }),
    ).toBe('/conferences/cns-2026')

    expect(
      getActivityPathFromReferenceValue({
        activityType: 'symposium',
        slug: 'symposium-2026',
      }),
    ).toBe('/symposium/symposium-2026')
  })
})
