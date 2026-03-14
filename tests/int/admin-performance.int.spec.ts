import { describe, expect, it } from 'vitest'

import { Announcements } from '@/collections/Announcements'
import { Activities } from '@/collections/Activities'
import { News } from '@/collections/News'
import { Posts } from '@/collections/Posts'
import { Research } from '@/collections/Research'

const getAutosaveConfig = (collection: { versions?: unknown }): unknown => {
  const drafts = (collection.versions as { drafts?: unknown } | undefined)?.drafts
  if (!drafts || typeof drafts !== 'object') return null

  return (drafts as { autosave?: unknown }).autosave
}

describe('Admin autosave performance defaults', () => {
  it.each([
    ['posts', Posts],
    ['news', News],
    ['announcements', Announcements],
    ['research', Research],
    ['activities', Activities],
  ])('disables autosave for %s to prevent mid-edit overwrite conflicts', (_slug, collection) => {
    const autosave = getAutosaveConfig(collection)
    expect(autosave).toBe(false)
  })
})
