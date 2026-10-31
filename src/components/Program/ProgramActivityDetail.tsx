import { ArrowUpRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { YouTubeEmbedBlock } from '@/blocks/YouTubeEmbed/Component'
import { MathJaxTypeset } from '@/components/MathJax/Typeset'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import RichText from '@/components/RichText'
import { SocialShare } from '@/components/SocialShare'
import { Tile, TileLinkOverlay, tilePillClassName, tileTitleClassName } from '@/components/Tile'
import type { Activity } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'
import { getYouTubeVideoId } from '@/utilities/youtube'

type ProgramEntry = Pick<
  Activity,
  | 'activityType'
  | 'bookChapters'
  | 'content'
  | 'date'
  | 'description'
  | 'location'
  | 'recordingUrl'
  | 'references'
  | 'title'
>

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mb-5 text-2xl font-semibold">{children}</h2>
)

export const ProgramActivityDetail: React.FC<{ entry: ProgramEntry; url: string }> = ({
  entry,
  url,
}) => {
  const eyebrow = 'Foundations Seminar'
  const videoId = getYouTubeVideoId(entry.recordingUrl)
  const chapters = entry.bookChapters ?? []
  const papers = entry.references ?? []

  return (
    <article className="pb-20 pt-6 md:pt-10">
      <MathJaxTypeset />
      <PayloadRedirects disableNotFound url={url} />

      <section className="container pt-8 md:pt-12">
        <div className="mx-auto max-w-3xl">
          <Link className="text-sm text-muted-foreground hover:text-primary" href="/seminars">
            ← Seminars
          </Link>
          <p className="page-eyebrow mt-6">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {entry.title}
          </h1>
          <div className="mt-6 h-1 w-28 rounded-full bg-linear-to-r from-primary to-accent" />
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="font-medium">Date</span>
              {entry.date ? (
                <time dateTime={entry.date}>{formatDateTime(entry.date)}</time>
              ) : (
                <span>Undated</span>
              )}
            </div>
            {entry.location && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Location</span>
                <span>{entry.location}</span>
              </div>
            )}
          </div>
          {entry.description && (
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              {entry.description}
            </p>
          )}
        </div>
      </section>

      <div className="container">
        <div className="mx-auto max-w-3xl">
          {videoId && (
            <section aria-label="Recording" className="mt-10">
              <SectionHeading>Recording</SectionHeading>
              <YouTubeEmbedBlock blockType="youtubeEmbed" title={entry.title} videoId={videoId} />
            </section>
          )}

          {chapters.length > 0 && (
            <section aria-label="In the NABI book" className="mt-10 scroll-mt-28" id="book">
              <SectionHeading>In the NABI book</SectionHeading>
              <ul className="grid gap-4 sm:grid-cols-2">
                {chapters.map((chapter, index) => (
                  <Tile as="li" className="h-full" key={chapter.id || index}>
                    <TileLinkOverlay
                      external
                      href={chapter.url}
                      label={`Open ${chapter.label} in the NABI book`}
                    />
                    <div className="relative flex h-full items-center gap-4 p-5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
                        <BookOpen aria-hidden className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          NABI book
                        </span>
                        <span
                          className={cn('block font-semibold leading-snug', tileTitleClassName)}
                        >
                          {chapter.label}
                        </span>
                      </span>
                      <ArrowUpRight
                        aria-hidden
                        className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                      />
                    </div>
                  </Tile>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">
                Lecture notes, slides, and runnable tutorials on{' '}
                <a className="underline hover:text-primary" href="https://book.nabilab.org">
                  book.nabilab.org
                </a>
                .
              </p>
            </section>
          )}

          {papers.length > 0 && (
            <section aria-label="References" className="mt-10">
              <SectionHeading>References</SectionHeading>
              <ol className="grid gap-4">
                {papers.map((paper, index) => {
                  const href = paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : null)
                  const authors = paper.authors
                    ?.map((author) => author.name)
                    .filter(Boolean)
                    .join(', ')
                  return (
                    <Tile as="li" key={paper.id || index}>
                      {href && (
                        <TileLinkOverlay external href={href} label={`Open ${paper.title}`} />
                      )}
                      <div className="relative flex gap-4 p-5 sm:p-6">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/15 to-accent/15 text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn('font-semibold leading-snug', tileTitleClassName)}>
                            {paper.title}
                          </p>
                          {authors && (
                            <p className="mt-1 text-sm text-muted-foreground">{authors}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {paper.journal && (
                              <span className={tilePillClassName}>{paper.journal}</span>
                            )}
                            {paper.year && <span className={tilePillClassName}>{paper.year}</span>}
                            {paper.doi && (
                              <span className={tilePillClassName}>DOI {paper.doi}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Tile>
                  )
                })}
              </ol>
            </section>
          )}

          <div className="mt-10" data-post-content>
            <RichText
              className="md:prose-lg prose-headings:scroll-mt-28"
              data={entry.content}
              enableGutter={false}
            />
          </div>

          <section className="mt-10">
            <SocialShare
              className="flex items-center gap-3 text-gray-500 dark:text-gray-400"
              text={entry.title || eyebrow}
              url={url}
            />
          </section>
        </div>
      </div>
    </article>
  )
}
