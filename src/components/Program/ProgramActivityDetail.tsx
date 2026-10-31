import Link from 'next/link'
import React from 'react'

import { YouTubeEmbedBlock } from '@/blocks/YouTubeEmbed/Component'
import { MathJaxTypeset } from '@/components/MathJax/Typeset'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import RichText from '@/components/RichText'
import { SocialShare } from '@/components/SocialShare'
import type { Activity } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
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
  const isTopicReview = entry.activityType === 'topic-review'
  const eyebrow = isTopicReview ? 'Topic Review Series' : 'Foundations Seminar'
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
            ← Seminars &amp; Topic Reviews
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
            <section aria-label="In the NABI book" className="mt-10">
              <SectionHeading>In the NABI book</SectionHeading>
              <ul className="grid gap-3 sm:grid-cols-2">
                {chapters.map((chapter, index) => (
                  <li key={chapter.id || index}>
                    <a
                      className="flex h-full items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/70 px-5 py-4 font-medium transition-colors hover:border-primary/60 hover:text-primary"
                      href={chapter.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>{chapter.label}</span>
                      <span aria-hidden>↗</span>
                    </a>
                  </li>
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
            <section
              aria-label={isTopicReview ? 'Papers reviewed' : 'References'}
              className="mt-10"
            >
              <SectionHeading>{isTopicReview ? 'Papers reviewed' : 'References'}</SectionHeading>
              <ol className="space-y-4 rounded-2xl border border-border/80 bg-card/70 p-6 sm:p-8">
                {papers.map((paper, index) => {
                  const href = paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : null)
                  const authors = paper.authors
                    ?.map((author) => author.name)
                    .filter(Boolean)
                    .join(', ')
                  return (
                    <li key={paper.id || index} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div className="flex-1 pt-1 text-sm leading-6">
                        {href ? (
                          <a
                            className="font-medium text-foreground hover:text-primary hover:underline"
                            href={href}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {paper.title}
                          </a>
                        ) : (
                          <span className="font-medium text-foreground">{paper.title}</span>
                        )}
                        <div className="text-muted-foreground">
                          {[authors, paper.journal, paper.year].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </li>
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
