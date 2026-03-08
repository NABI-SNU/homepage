import { describe, expect, it } from 'vitest'

import { renderMystToHtml } from '@/utilities/renderMystToHtml'

describe('renderMystToHtml', () => {
  it('renders headings and admonitions from MyST markdown', () => {
    const html = renderMystToHtml(`# Notebook Title

## Results

:::{note}
Important detail
:::
`)

    expect(html).toContain('Notebook Title')
    expect(html).toContain('Results')
    expect(html).toContain('Important detail')
    expect(html).toMatch(/aside|admonition/i)
  })
})
