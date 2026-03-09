'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useDeferredValue, useMemo, useState } from 'react'
import { Search, ArrowRight, BookOpen, Clock, Users } from 'lucide-react'

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
  incomingLinks: number
}

type ContributorInfo = {
  name: string
  email: string | null
  slug: string | null
  avatar: string | null
  wikiCount: number
}

type SortOption = 'alphabetical' | 'updated'

function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

function WikiArticleCard({ item, showDate = false }: { item: WikiSearchItem; showDate?: boolean }) {
  return (
    <Link
      className="group relative flex h-full flex-col rounded-2xl border border-border/80 bg-card/70 p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
      href={`/wiki/${item.slug}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-r from-primary/5 to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative">
        {showDate && item.updatedAt && (
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {formatRelativeDate(item.updatedAt)}
          </p>
        )}
        <h3 className="text-lg font-semibold leading-tight transition-colors duration-300 group-hover:text-primary">
          {item.title}
        </h3>
        {item.summary && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.summary}
          </p>
        )}
      </div>

      {item.tags.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary"
              key={`${item.slug}-${tag.slug}`}
            >
              #{tag.title}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="rounded-full px-2 py-0.5 text-xs text-muted-foreground">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

function ContributorCard({ contributor }: { contributor: ContributorInfo }) {
  const initials = contributor.name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const content = (
    <div className="group relative flex items-center gap-4 rounded-2xl border border-border/80 bg-card/70 p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-r from-primary/5 to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-sm font-semibold text-muted-foreground">
        {contributor.avatar ? (
          <Image
            alt={`${contributor.name} avatar`}
            className="h-full w-full object-cover"
            fill
            sizes="44px"
            src={contributor.avatar}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <div className="relative min-w-0 flex-1">
        <p className="truncate text-sm font-semibold transition-colors duration-300 group-hover:text-primary">
          {contributor.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {contributor.wikiCount} {contributor.wikiCount === 1 ? 'article' : 'articles'}
        </p>
      </div>
    </div>
  )

  if (contributor.slug) {
    return <Link href={`/people/${contributor.slug}`}>{content}</Link>
  }

  return content
}

export function WikiIndex({
  allItems,
  contributors,
  featured,
  recent,
}: {
  allItems: WikiSearchItem[]
  contributors: ContributorInfo[]
  featured: WikiSearchItem[]
  recent: WikiSearchItem[]
}) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('updated')
  const [selectedTag, setSelectedTag] = useState('')
  const deferredQuery = useDeferredValue(query)

  const isSearching = deferredQuery.trim().length > 0 || selectedTag.length > 0

  const tags = useMemo(() => {
    const unique = new Map<string, string>()
    allItems.forEach((item) => {
      item.tags.forEach((tag) => {
        if (!tag.slug) return
        if (!unique.has(tag.slug)) unique.set(tag.slug, tag.title)
      })
    })
    return Array.from(unique.entries())
      .map(([slug, title]) => ({ slug, title }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [allItems])

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    const searched = allItems.filter((item) => {
      if (selectedTag && !item.tags.some((tag) => tag.slug === selectedTag)) return false
      if (!normalizedQuery) return true
      const searchable = [
        item.title,
        item.summary || '',
        item.tags.map((tag) => tag.title).join(' '),
      ]
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
  }, [deferredQuery, allItems, selectedTag, sortBy])

  return (
    <>
      {/* Search Bar */}
      <section className="container mt-8">
        <div className="mx-auto max-w-2xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Search wiki"
              className="w-full rounded-xl border border-border bg-card/70 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages, summaries, or tags..."
              type="text"
              value={query}
            />
          </div>
        </div>
      </section>

      {isSearching ? (
        /* Full Search Results */
        <section className="container mt-8 pb-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              </p>
              {(query || selectedTag) && (
                <button
                  className="cursor-pointer text-sm text-primary transition-colors hover:text-accent hover:underline"
                  onClick={() => {
                    setQuery('')
                    setSelectedTag('')
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <select
                aria-label="Filter by tag"
                className="rounded-lg border border-border bg-card/70 px-3 py-2 text-sm text-foreground"
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
                className="rounded-lg border border-border bg-card/70 px-3 py-2 text-sm text-foreground"
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                value={sortBy}
              >
                <option value="updated">Recently updated</option>
                <option value="alphabetical">A &rarr; Z</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card/40 p-10 text-center">
              <p className="text-sm text-muted-foreground">No wiki pages matched your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <WikiArticleCard item={item} key={item.slug} showDate />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Default Landing Sections */
        <>
          {/* Featured Articles */}
          {featured.length > 0 && (
            <section className="container section-gap">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <BookOpen aria-hidden className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">Featured Articles</h2>
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-accent"
                  href="/wiki/graph"
                >
                  View graph
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featured.map((item) => (
                  <WikiArticleCard item={item} key={item.slug} />
                ))}
              </div>
            </section>
          )}

          {/* Recent Articles */}
          {recent.length > 0 && (
            <section className="container section-gap">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <Clock aria-hidden className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold">Recent Articles</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recent.map((item) => (
                  <WikiArticleCard item={item} key={item.slug} showDate />
                ))}
              </div>
            </section>
          )}

          {contributors.length > 0 && (
            <section className="container section-gap pb-12">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Users aria-hidden className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">Top Contributors</h2>
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-accent"
                  href="/people"
                >
                  All members
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {contributors.map((contributor) => (
                  <ContributorCard contributor={contributor} key={contributor.name} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  )
}
