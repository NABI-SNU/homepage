'use client'

import Link from 'next/link'
import { useDeferredValue, useMemo, useState } from 'react'

type WikiTag = {
  slug: string
  title: string
}

type WikiSearchItem = {
  slug: string
  summary?: string | null
  tags: WikiTag[]
  title: string
  updatedAt?: string
}

type SortOption = 'alphabetical' | 'updated'

export function WikiSearch({ items }: { items: WikiSearchItem[] }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('updated')
  const [selectedTag, setSelectedTag] = useState('')
  const deferredQuery = useDeferredValue(query)

  const tags = useMemo(() => {
    const unique = new Map<string, string>()
    items.forEach((item) => {
      item.tags.forEach((tag) => {
        if (!tag.slug) return
        if (!unique.has(tag.slug)) unique.set(tag.slug, tag.title)
      })
    })

    return Array.from(unique.entries())
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [items])

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    const searched = items.filter((item) => {
      if (selectedTag && !item.tags.some((tag) => tag.slug === selectedTag)) return false
      if (!normalizedQuery) return true

      const searchable = [item.title, item.summary || '', item.tags.map((tag) => tag.title).join(' ')]
        .join(' ')
        .toLowerCase()
      return searchable.includes(normalizedQuery)
    })

    if (sortBy === 'alphabetical') {
      return [...searched].sort((a, b) => a.title.localeCompare(b.title))
    }

    return [...searched].sort((a, b) => {
      const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return bDate - aDate
    })
  }, [deferredQuery, items, selectedTag, sortBy])

  return (
    <div>
      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input
          aria-label="Search wiki"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages, summaries, or tags"
          type="text"
          value={query}
        />
        <select
          aria-label="Filter by tag"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          onChange={(event) => setSelectedTag(event.target.value)}
          value={selectedTag}
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.slug} value={tag.slug}>
              {tag.title}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort wiki pages"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          onChange={(event) => setSortBy(event.target.value as SortOption)}
          value={sortBy}
        >
          <option value="updated">Recently updated</option>
          <option value="alphabetical">A → Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border/70 bg-card/40 p-6 text-sm text-muted-foreground">
          No wiki pages matched your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <Link
              className="rounded-2xl border border-border/70 bg-card/70 p-5 transition hover:border-primary/30 hover:bg-muted/50"
              href={`/wiki/${item.slug}`}
              key={item.slug}
            >
              <h2 className="text-xl font-semibold">{item.title}</h2>
              {item.summary && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>}
              {item.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      key={`${item.slug}-${tag.slug}`}
                    >
                      #{tag.title}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

