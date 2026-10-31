import { describe, expect, it } from 'vitest'

import {
  getActivityPath,
  getActivityPathFromReferenceValue,
  getActivityPreviewPath,
} from '@/utilities/activityURL'
import { getYouTubeVideoId } from '@/utilities/youtube'

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

  it('returns seminar routes', () => {
    expect(getActivityPath({ activityType: 'seminar', slug: '2026-hidden-dynamics' })).toBe(
      '/seminars/2026-hidden-dynamics',
    )
    expect(
      getActivityPathFromReferenceValue({ activityType: 'seminar', slug: '2026-hidden-dynamics' }),
    ).toBe('/seminars/2026-hidden-dynamics')
  })

  it('returns no path for a non-symposium activity without a slug', () => {
    expect(getActivityPath({ activityType: 'seminar', slug: null })).toBeNull()
  })

  it('builds preview paths for every activity type', () => {
    const pathOf = (preview: string | null) =>
      new URLSearchParams((preview || '').split('?')[1]).get('path')

    expect(pathOf(getActivityPreviewPath({ activityType: 'seminar', slug: 'a' }))).toBe(
      '/seminars/a',
    )
    expect(pathOf(getActivityPreviewPath({ activityType: 'conference', slug: null }))).toBe(
      '/conferences',
    )
    expect(pathOf(getActivityPreviewPath({ activityType: 'symposium', slug: null }))).toBe(
      '/symposium',
    )
  })
})

describe('getYouTubeVideoId', () => {
  it('parses the common YouTube URL forms', () => {
    expect(getYouTubeVideoId('https://youtu.be/9gWRUOZVniw')).toBe('9gWRUOZVniw')
    expect(getYouTubeVideoId('https://youtu.be/9gWRUOZVniw?si=abc')).toBe('9gWRUOZVniw')
    expect(getYouTubeVideoId('https://www.youtube.com/watch?v=ZyfXsAtiUjg&t=10')).toBe(
      'ZyfXsAtiUjg',
    )
    expect(getYouTubeVideoId('https://www.youtube.com/embed/76yK7wj30dU')).toBe('76yK7wj30dU')
    expect(getYouTubeVideoId('0wJqJhq6No4')).toBe('0wJqJhq6No4')
  })

  it('rejects other URLs and empty values', () => {
    expect(getYouTubeVideoId('https://example.com/watch?v=ZyfXsAtiUjg')).toBeNull()
    expect(getYouTubeVideoId('not a url')).toBeNull()
    expect(getYouTubeVideoId(null)).toBeNull()
  })
})
