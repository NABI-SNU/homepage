import { describe, expect, it } from 'vitest'

import { getActivityPreviewPath } from '@/utilities/activityURL'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'

describe('preview path generation', () => {
  it('does not include a shared preview secret for collection previews', () => {
    const previewPath = generatePreviewPath({
      collection: 'posts',
      req: {} as never,
      slug: 'hello world',
    })

    expect(previewPath).toBeTruthy()

    const params = new URLSearchParams(previewPath?.split('?')[1])
    expect(params.get('previewSecret')).toBeNull()
    expect(params.get('slug')).toBe('hello world')
    expect(params.get('path')).toBe('/posts/hello%20world')
  })

  it('does not include a shared preview secret for activity previews', () => {
    const previewPath = getActivityPreviewPath({
      activityType: 'conference',
      slug: 'neurips 2026',
    })

    expect(previewPath).toBeTruthy()

    const params = new URLSearchParams(previewPath?.split('?')[1])
    expect(params.get('previewSecret')).toBeNull()
    expect(params.get('slug')).toBe('neurips 2026')
    expect(params.get('path')).toBe('/conferences/neurips%202026')
  })
})
