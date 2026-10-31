import Link from 'next/link'
import React from 'react'

import { Tile, TileLinkOverlay, tilePillClassName, tileTitleClassName } from '@/components/Tile'
import type { ProgramActivity } from '@/utilities/activityCache'
import { getActivityPath } from '@/utilities/activityURL'
import { formatDateTime } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'

type YearGroup = {
  seminars: ProgramActivity[]
  topicReviews: ProgramActivity[]
  year: number
}

const getYear = (date: string | null | undefined): number | null => {
  if (!date) return null
  const timestamp = Date.parse(date)
  return Number.isFinite(timestamp) ? new Date(timestamp).getUTCFullYear() : null
}

const byDateAscending = (a: ProgramActivity, b: ProgramActivity) =>
  (a.date || '').localeCompare(b.date || '')

export const groupProgramByYear = (activities: ProgramActivity[]): YearGroup[] => {
  const groups = new Map<number, YearGroup>()

  for (const activity of activities) {
    const year = getYear(activity.date)
    if (year === null) continue
    const group = groups.get(year) ?? { seminars: [], topicReviews: [], year }
    if (activity.activityType === 'seminar') group.seminars.push(activity)
    if (activity.activityType === 'topic-review') group.topicReviews.push(activity)
    groups.set(year, group)
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      seminars: group.seminars.sort(byDateAscending),
      topicReviews: group.topicReviews.sort(byDateAscending),
    }))
    .sort((a, b) => b.year - a.year)
}

const ProgramItem: React.FC<{ activity: ProgramActivity; now: number }> = ({ activity, now }) => {
  const href = getActivityPath(activity)
  const isUpcoming = activity.date ? Date.parse(activity.date) > now : false
  const paperCount = activity.references?.length ?? 0
  const chapterCount = activity.bookChapters?.length ?? 0

  return (
    <Tile as="li" className="h-full">
      {href && <TileLinkOverlay href={href} label={`Open ${activity.title}`} />}
      <div className="relative flex h-full flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {activity.date && <time dateTime={activity.date}>{formatDateTime(activity.date)}</time>}
          {activity.location && <span>· {activity.location}</span>}
          {isUpcoming && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-semibold normal-case tracking-normal text-primary">
              Upcoming
            </span>
          )}
        </div>
        <h3 className={cn('mt-3 text-xl font-semibold leading-snug', tileTitleClassName)}>
          {activity.title}
        </h3>
        {activity.description && (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{activity.description}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {activity.recordingUrl && <span className={tilePillClassName}>Recording</span>}
          {chapterCount > 0 && (
            <span className={tilePillClassName}>
              {chapterCount === 1 ? 'Book chapter' : `${chapterCount} book chapters`}
            </span>
          )}
          {paperCount > 0 && (
            <span className={tilePillClassName}>
              {paperCount === 1 ? '1 paper' : `${paperCount} papers`}
            </span>
          )}
        </div>
      </div>
    </Tile>
  )
}

const ProgramSection: React.FC<{
  activities: ProgramActivity[]
  description: string
  id: string
  now: number
  title: string
}> = ({ activities, description, id, now, title }) => {
  if (activities.length === 0) return null

  return (
    <section aria-labelledby={id} className="mt-8">
      <h3 id={id} className="text-xl font-semibold">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <ol className="mt-4 grid gap-4 md:grid-cols-2">
        {activities.map((activity) => (
          <ProgramItem key={activity.id} activity={activity} now={now} />
        ))}
      </ol>
    </section>
  )
}

export const ProgramArchive: React.FC<{ activities: ProgramActivity[] }> = ({ activities }) => {
  const groups = groupProgramByYear(activities)
  // Rendered on the server and revalidated hourly, so "upcoming" is accurate to within an hour.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()

  return (
    <main className="page-shell">
      <section className="page-header container text-center">
        <p className="page-eyebrow">Activities</p>
        <h1 className="page-title-lg">Seminars &amp; Topic Reviews</h1>
        <p className="page-subtitle mx-auto mt-4 max-w-2xl">
          Each year NABI works through a shared curriculum in the Foundations Seminar, then reads
          current papers together in the Topic Review Series, and presents the results at the annual
          Symposium.
        </p>
      </section>

      <div className="container mx-auto max-w-5xl pb-16">
        {groups.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No sessions published yet.</p>
        )}

        {groups.map((group) => (
          <section key={group.year} aria-labelledby={`program-${group.year}`} className="mt-12">
            <h2
              id={`program-${group.year}`}
              className="border-b-2 border-border pb-3 text-3xl font-bold tracking-tight"
            >
              NABI {group.year}
            </h2>
            <ProgramSection
              activities={group.seminars}
              description="Concept lectures and hands-on tutorials from the NABI book."
              id={`seminars-${group.year}`}
              now={now}
              title="Foundations Seminar"
            />
            <ProgramSection
              activities={group.topicReviews}
              description="Monthly paper reviews: two papers, presentation and discussion."
              id={`topic-reviews-${group.year}`}
              now={now}
              title="Topic Review Series"
            />
          </section>
        ))}

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Papers from every Topic Review are also collected in the{' '}
          <Link className="underline hover:text-primary" href="/references">
            Bibliography
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
