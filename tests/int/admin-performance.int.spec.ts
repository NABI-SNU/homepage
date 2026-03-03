import { describe, expect, it } from 'vitest'

import { News } from '@/collections/News'
import { Posts } from '@/collections/Posts'
import { Research } from '@/collections/Research'

const DEFAULT_AUTOSAVE_INTERVAL_MS = 800

const getAutosaveInterval = (collection: { versions?: unknown }): number | null => {
  const drafts = (collection.versions as { drafts?: unknown } | undefined)?.drafts
  if (!drafts || typeof drafts !== 'object') return null

  const autosave = (drafts as { autosave?: unknown }).autosave
  if (autosave === true) return DEFAULT_AUTOSAVE_INTERVAL_MS
  if (!autosave || typeof autosave !== 'object') return null

  return (autosave as { interval?: number }).interval ?? DEFAULT_AUTOSAVE_INTERVAL_MS
}

describe('Admin autosave performance defaults', () => {
  it.each([
    ['posts', Posts],
    ['news', News],
    ['research', Research],
  ])('uses a non-aggressive autosave interval for %s', (_slug, collection) => {
    const interval = getAutosaveInterval(collection)
    expect(interval).not.toBeNull()
    expect(interval).toBeGreaterThanOrEqual(DEFAULT_AUTOSAVE_INTERVAL_MS)
  })
})
