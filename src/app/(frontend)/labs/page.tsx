import type { Metadata } from 'next'

import Link from 'next/link'

import { Media } from '@/components/Media'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getCachedResearchList } from '@/utilities/getResearchBySlug'

export const revalidate = 3600

export default async function ResearchListPage() {
  const research = await getCachedResearchList()()

  return (
    <main className="page-shell">
      <section className="container page-header text-center">
        <div className="mx-auto max-w-3xl">
          <p className="page-eyebrow">Research</p>
          <h1 className="page-title-lg">Notebooks and notes</h1>
        </div>
      </section>

      <section className="container section-gap">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              All research documents
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {research.length} published entr{research.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {research.map((item) => (
            <article
              className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/70 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/30 hover:shadow-xl"
              key={item.id}
            >
              <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/5 to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="pointer-events-none absolute -left-1 -top-1 h-8 w-8 rounded-full bg-linear-to-br from-primary/20 to-accent/20 opacity-0 blur-sm transition-all duration-500 ease-out group-hover:scale-150 group-hover:opacity-100" />
              <div className="pointer-events-none absolute bottom-4 right-4 h-2 w-2 rounded-full bg-linear-to-r from-green-400 to-primary opacity-0 transition-all duration-300 ease-out group-hover:scale-125 group-hover:opacity-100 group-hover:shadow-lg group-hover:shadow-primary/40" />

              {item.slug ? (
                <Link
                  aria-label={`Read ${item.title}`}
                  className="absolute inset-0 z-10 rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                  href={`/labs/${item.slug}`}
                />
              ) : null}

              {item.image && typeof item.image === 'object' ? (
                <Media
                  imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  pictureClassName="block aspect-[16/10] h-full w-full overflow-hidden"
                  resource={item.image}
                  size="(min-width: 1280px) 24rem, (min-width: 768px) 50vw, 100vw"
                />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-muted/30 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Research notebook
                </div>
              )}

              <div className="relative z-20 flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {item.date ? <span>{formatDateTime(item.date)}</span> : null}
                  <span>{item.notebook ? 'Notebook attached' : 'Note only'}</span>
                </div>

                <h3 className="mt-4 text-xl font-semibold leading-tight text-foreground">
                  {item.title}
                </h3>

                {item.description ? (
                  <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                ) : (
                  <div className="flex-1" />
                )}

                {item.slug ? (
                  <p className="mt-6 inline-flex items-center text-sm font-medium text-foreground transition group-hover:text-primary">
                    Read notebook
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Research',
  description:
    'Research notes from NABI, the Natural and Artificial Brain Intelligence study group.',
}
