import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { PersonAvatar } from '@/components/people/PersonAvatar'
import { PersonSocialLinks } from '@/components/people/PersonSocialLinks'
import { parseResearchTags, toTagSlug } from '@/utilities/researchTags'

export const revalidate = 600

type Args = {
  searchParams?: Promise<{
    year?: string
    q?: string
  }>
}

export default async function PeoplePage({ searchParams: searchParamsPromise }: Args) {
  const searchParams = searchParamsPromise ? await searchParamsPromise : {}
  const payload = await getPayload({ config: configPromise })

  const people = await payload.find({
    collection: 'people',
    depth: 1,
    limit: 1000,
    pagination: false,
    overrideAccess: false,
    sort: 'name',
    select: {
      name: true,
      slug: true,
      email: true,
      research: true,
      socials: true,
      joinedYear: true,
      avatar: true,
    },
  })

  const years = Array.from(
    new Set(
      people.docs
        .map((person) => person.joinedYear)
        .filter((year): year is number => typeof year === 'number' && Number.isFinite(year)),
    ),
  ).sort((a, b) => b - a)

  const requestedYear = searchParams?.year ? Number(searchParams.year) : null
  const activeYear =
    requestedYear && years.includes(requestedYear) ? requestedYear : years[0] || 2025
  const searchQuery = searchParams?.q?.trim() || ''
  const normalizedSearchQuery = searchQuery.toLowerCase()

  const filteredByYear = people.docs.filter((person) => {
    const joinedYear = typeof person.joinedYear === 'number' ? person.joinedYear : 2025
    return joinedYear === activeYear
  })
  const filteredPeople = filteredByYear.filter((person) => {
    if (!normalizedSearchQuery) return true

    const searchableFields = [
      person.name,
      person.email || '',
      parseResearchTags(person.research).join(' '),
    ]

    return searchableFields.some((field) => field.toLowerCase().includes(normalizedSearchQuery))
  })

  return (
    <main className="page-shell">
      <section className="page-header container text-center">
        <p className="page-eyebrow">People</p>
        <h1 className="page-title-lg">Meet our Members</h1>
      </section>

      <section className="container mt-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <form action="/people" className="relative w-full sm:w-[260px]" method="get">
            <input name="year" type="hidden" value={activeYear} />
            <input
              aria-label="Search people"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              defaultValue={searchQuery}
              name="q"
              placeholder="Search people"
              type="text"
            />
          </form>
          {searchQuery && (
            <Link
              href={`/people?year=${activeYear}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>

        {years.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Joined</span>
            <div className="inline-flex overflow-hidden rounded-full border border-border">
              {years.map((year) => {
                const isActive = year === activeYear
                const href = searchQuery
                  ? `/people?year=${year}&q=${encodeURIComponent(searchQuery)}`
                  : `/people?year=${year}`

                return (
                  <Link
                    key={year}
                    href={href}
                    className={[
                      'px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    ].join(' ')}
                  >
                    {year}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <section className="container section-gap relative pb-16 md:pb-20 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/8 blur-3xl" />
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filteredPeople.map((person) => {
            const researchTopics = parseResearchTags(person.research)

            return (
              <article key={person.id} className="group relative h-full">
                <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/6 to-accent/6 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute -left-1 -top-1 h-8 w-8 rounded-full bg-linear-to-br from-primary/20 to-accent/20 opacity-0 blur-sm transition-all duration-500 ease-out group-hover:scale-150 group-hover:opacity-100" />

                <div className="relative flex h-full flex-col rounded-2xl border border-border/80 bg-card/70 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/30 hover:shadow-xl">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h2 className="text-2xl font-bold transition-colors duration-300 group-hover:text-primary">
                      {person.name}
                    </h2>
                    <PersonAvatar
                      avatar={person.avatar}
                      className="shrink-0"
                      email={person.email}
                      name={person.name}
                      size={44}
                    />
                  </div>

                  <div className="mb-6 grow">
                    <div className="mb-2 inline-flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-primary/90">
                        Research Interests
                      </span>
                    </div>
                    {researchTopics.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {researchTopics.map((topic) => {
                          const slug = toTagSlug(topic)

                          if (!slug) {
                            return (
                              <span
                                key={topic}
                                className="rounded-full border border-border/70 bg-card/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground"
                              >
                                {topic}
                              </span>
                            )
                          }

                          return (
                            <Link
                              key={topic}
                              href={`/topics/${slug}`}
                              className="rounded-full border border-border/70 bg-card/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground hover:border-primary/40 hover:text-foreground"
                            >
                              {topic}
                            </Link>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="leading-relaxed text-muted-foreground">
                        No research summary yet.
                      </p>
                    )}
                  </div>

                  <PersonSocialLinks className="mb-6" socials={person.socials} />

                  <div className="mt-auto flex items-center justify-between">
                    {person.email ? (
                      <a
                        href={`mailto:${person.email}`}
                        className="inline-flex items-center gap-2 text-sm text-primary transition-all duration-300 hover:gap-3 hover:underline"
                      >
                        {person.email}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">No email listed</span>
                    )}
                    <Link
                      href={`/people/${person.slug}`}
                      className="text-sm font-semibold transition-colors hover:text-primary hover:underline"
                    >
                      Profile
                    </Link>
                  </div>

                  <div className="absolute bottom-4 right-4 h-2 w-2 rounded-full bg-linear-to-r from-green-400 to-primary opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-primary/40" />
                </div>
              </article>
            )
          })}
          {filteredPeople.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No members found for {activeYear}
              {searchQuery ? ` matching "${searchQuery}".` : '.'}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'People',
  description: 'Meet the members and collaborators of the NABI Labs.',
}
