import { describe, expect, it } from 'vitest'

import { createS3CollectionConfig } from '@/utilities/uploadStorage'

describe('upload storage config', () => {
  it('preserves the base media prefix for media uploads', () => {
    const config = createS3CollectionConfig({
      basePrefix: 'media-root',
      publicURL: 'https://cdn.example.com/assets',
    })

    expect(config).not.toBe(true)
    expect(config).toMatchObject({
      prefix: 'media-root',
    })
    expect(
      config && config !== true ? config.generateFileURL?.({ filename: 'chart.webp' }) : '',
    ).toBe('https://cdn.example.com/assets/media-root/chart.webp')
  })

  it('nests notebook uploads beneath the configured prefix', () => {
    const config = createS3CollectionConfig({
      basePrefix: 'media-root',
      publicURL: 'https://cdn.example.com/assets',
      subdir: 'notebooks',
    })

    expect(config).not.toBe(true)
    expect(config).toMatchObject({
      prefix: 'media-root/notebooks',
    })
    expect(
      config && config !== true
        ? config.generateFileURL?.({
            filename: 'Analysis Notebook.ipynb',
            prefix: 'media-root/notebooks',
          })
        : '',
    ).toBe('https://cdn.example.com/assets/media-root/notebooks/Analysis%20Notebook.ipynb')
  })

  it('falls back to a notebooks prefix when no base prefix is configured', () => {
    const config = createS3CollectionConfig({
      publicURL: 'https://cdn.example.com',
      subdir: 'notebooks',
    })

    expect(config).not.toBe(true)
    expect(config).toMatchObject({
      prefix: 'notebooks',
    })
    expect(
      config && config !== true ? config.generateFileURL?.({ filename: 'demo.ipynb' }) : '',
    ).toBe('https://cdn.example.com/notebooks/demo.ipynb')
  })
})
