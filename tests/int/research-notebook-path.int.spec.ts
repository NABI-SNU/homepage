import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { resolveResearchNotebookPath } from '@/utilities/researchNotebook'

describe('resolveResearchNotebookPath', () => {
  it('resolves notebook paths inside content/notebooks', () => {
    const resolved = resolveResearchNotebookPath('notebooks/subdir/example.ipynb')

    expect(resolved).toBe(path.resolve(process.cwd(), 'content/notebooks/subdir/example.ipynb'))
  })

  it('rejects traversal outside content/notebooks', () => {
    expect(resolveResearchNotebookPath('../../package.json')).toBeNull()
    expect(resolveResearchNotebookPath('notebooks/../../secrets.json')).toBeNull()
    expect(resolveResearchNotebookPath('/etc/passwd')).toBeNull()
  })

  it('rejects non-notebook file extensions', () => {
    expect(resolveResearchNotebookPath('notebooks/example.json')).toBeNull()
  })
})
