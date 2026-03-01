'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import React, { useMemo, useState } from 'react'

type ReferenceSource = {
  type: 'posts' | 'news' | 'research'
  title: string
  url: string
}

export type ReferenceSearchItem = {
  title: string
  authors: string[]
  journal?: string | null
  year?: number | null
  doi?: string | null
  url?: string | null
  sources: ReferenceSource[]
}

type SortOption = 'alphabetical' | 'recent' | 'oldest'

const PAGE_SIZE = 18
const SOURCE_TITLE_MAX = 28

const truncate = (value: string, max: number) => (value.length > max ? `${value.slice(0, max)}...` : value)

const sourceLabel: Record<ReferenceSource['type'], string> = {
  posts: 'Post',
  news: 'News',
  research: 'Research',
}

export function ReferenceSearch({ references }: { references: ReferenceSearchItem[] }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    const trimmed = query.toLowerCase().trim()
    if (!trimmed) return references

    return references.filter((reference) => {
      const fields = [
        reference.title,
        ...reference.authors,
        reference.journal || '',
        String(reference.year || ''),
      ]

      return fields.some((field) => field.toLowerCase().includes(trimmed))
    })
  }, [query, references])

  const sorted = useMemo(() => {
    const next = [...filtered]

    next.sort((a, b) => {
      if (sortBy === 'recent') return (b.year || 0) - (a.year || 0)
      if (sortBy === 'oldest') return (a.year || 0) - (b.year || 0)
      return a.title.localeCompare(b.title)
    })

    return next
  }, [filtered, sortBy])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))

  const page = Math.min(currentPage, totalPages)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const onQueryChange = (value: string) => {
    setQuery(value)
    setCurrentPage(1)
  }

  const onSortChange = (value: SortOption) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const paginationNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative w-full sm:w-[220px]">
          <input
            aria-label="Search references"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search for a paper"
            type="text"
            value={query}
          />
        </div>

        <div className="flex justify-start sm:ml-auto sm:justify-end">
          <div className="inline-flex overflow-hidden rounded-full border border-border">
            {[
              { label: 'A -> Z', value: 'alphabetical' as const },
              { label: 'Newest', value: 'recent' as const },
              { label: 'Oldest', value: 'oldest' as const },
            ].map((tab) => {
              const selected = sortBy === tab.value
              return (
                <button
                  className={[
                    'px-4 py-2 text-sm font-medium transition-colors',
                    selected
                      ? 'bg-muted text-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  ].join(' ')}
                  key={tab.value}
                  onClick={() => onSortChange(tab.value)}
                  type="button"
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {paginated.length === 0 ? (
        <p className="rounded-xl border border-border/70 bg-card/40 p-6 text-sm text-muted-foreground">
          No references matched your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {paginated.map((reference, index) => {
            const href = reference.url || (reference.doi ? `https://doi.org/${reference.doi}` : '')
            const absoluteIndex = (page - 1) * PAGE_SIZE + index + 1

            return (
              <article
                key={`${reference.title}-${absoluteIndex}`}
                className="group relative h-full overflow-hidden rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl"
              >
                <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/5 to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative z-10 flex h-full flex-col">
                  {href && (
                    <a
                      href={href}
                      rel="noreferrer"
                      target="_blank"
                      className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                      aria-label="Open paper source in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {absoluteIndex}
                    </span>
                    <div className="flex-1 pr-10">
                      <h2 className="text-xl font-semibold leading-tight">{reference.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {reference.authors.join(', ')}
                      </p>

                      {(reference.journal || reference.year) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {reference.journal && <span className="italic">{reference.journal}</span>}
                          {reference.journal && reference.year && <span className="mx-2">•</span>}
                          {reference.year && <span>{reference.year}</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  {(reference.sources.length > 0 || href) && (
                    <div className="mt-auto pt-4">
                      {reference.sources.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            As covered in
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {reference.sources.map((source, sourceIndex) => (
                              <Link
                                key={`${source.title}-${sourceIndex}`}
                                href={source.url}
                                className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-all duration-200 hover:border-primary/35 hover:bg-primary/15"
                              >
                                <span className="uppercase tracking-wide">{sourceLabel[source.type]}</span>
                                <span className="text-foreground/85">· {truncate(source.title, SOURCE_TITLE_MAX)}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {href && (
                        <a
                          href={href}
                          rel="noreferrer"
                          target="_blank"
                          className="mt-4 inline-block text-sm text-primary transition-colors hover:underline"
                        >
                          Open source
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="pointer-events-none absolute -left-1 -top-1 h-8 w-8 rounded-full bg-linear-to-br from-primary/20 to-accent/20 opacity-0 blur-sm transition-all duration-500 ease-out group-hover:scale-150 group-hover:opacity-100" />
                <div className="pointer-events-none absolute bottom-4 left-4 h-2 w-2 rounded-full bg-linear-to-r from-green-400 to-primary opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-primary/40" />
              </article>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 mb-12 flex flex-wrap items-center justify-center gap-2">
          <button
            aria-label="Previous page"
            className="rounded-sm border border-border bg-background px-3 py-1 text-sm text-foreground disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setCurrentPage(page - 1)}
            type="button"
          >
            ←
          </button>
          {paginationNumbers.map((number) => (
            <button
              className={[
                'rounded-sm border border-border px-3 py-1 text-sm',
                number === page
                  ? 'bg-muted font-semibold text-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              ].join(' ')}
              key={number}
              onClick={() => setCurrentPage(number)}
              type="button"
            >
              {number}
            </button>
          ))}
          <button
            aria-label="Next page"
            className="rounded-sm border border-border bg-background px-3 py-1 text-sm text-foreground disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setCurrentPage(page + 1)}
            type="button"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
