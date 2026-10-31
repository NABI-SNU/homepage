import { BookOpen, PlayCircle } from 'lucide-react'
import React from 'react'

import { Tile, TileAction, TileLinkOverlay, tileTitleClassName } from '@/components/Tile'
import type { ProgramActivity } from '@/utilities/activityCache'
import { getActivityPath } from '@/utilities/activityURL'
import { formatDateTime } from '@/utilities/formatDateTime'
import { cn } from '@/utilities/ui'

type YearGroup = {
  seminars: ProgramActivity[]
  year: number
}

const getYear = (date: string | null | undefined): number | null => {
  if (!date) return null
  const timestamp = Date.parse(date)
  return Number.isFinite(timestamp) ? new Date(timestamp).getUTCFullYear() : null
}

const byDateAscending = (a: ProgramActivity, b: ProgramActivity) =>
  (a.date || '').localeCompare(b.date || '')

export const groupSeminarsByYear = (activities: ProgramActivity[]): YearGroup[] => {
  const groups = new Map<number, YearGroup>()

  for (const activity of activities) {
    if (activity.activityType !== 'seminar') continue
    const year = getYear(activity.date)
    if (year === null) continue
    const group = groups.get(year) ?? { seminars: [], year }
    group.seminars.push(activity)
    groups.set(year, group)
  }

  return Array.from(groups.values())
    .map((group) => ({ ...group, seminars: group.seminars.sort(byDateAscending) }))
    .sort((a, b) => b.year - a.year)
}

const SeminarTile: React.FC<{ activity: ProgramActivity; now: number }> = ({ activity, now }) => {
  const href = getActivityPath(activity)
  const isUpcoming = activity.date ? Date.parse(activity.date) > now : false
  const chapters = activity.bookChapters ?? []
  const singleChapter = chapters.length === 1 ? chapters[0] : null

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
        {(activity.recordingUrl || chapters.length > 0) && (
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            {activity.recordingUrl && (
              <TileAction
                external
                href={activity.recordingUrl}
                icon={<PlayCircle aria-hidden className="h-3.5 w-3.5" />}
                label={`Watch the recording of ${activity.title}`}
              >
                Recording
              </TileAction>
            )}
            {singleChapter && (
              <TileAction
                external
                href={singleChapter.url}
                icon={<BookOpen aria-hidden className="h-3.5 w-3.5" />}
                label={`Open ${singleChapter.label} in the NABI book`}
              >
                Book chapter
              </TileAction>
            )}
            {chapters.length > 1 && href && (
              <TileAction
                href={`${href}#book`}
                icon={<BookOpen aria-hidden className="h-3.5 w-3.5" />}
                label={`See the ${chapters.length} book chapters for ${activity.title}`}
              >
                {chapters.length} book chapters
              </TileAction>
            )}
          </div>
        )}
      </div>
    </Tile>
  )
}

export const ProgramArchive: React.FC<{ activities: ProgramActivity[] }> = ({ activities }) => {
  const groups = groupSeminarsByYear(activities)
  // Rendered on the server and revalidated hourly, so "upcoming" is accurate to within an hour.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()

  return (
    <main className="page-shell">
      <section className="page-header container text-center">
        <p className="page-eyebrow">Activities</p>
        <h1 className="page-title-lg">Seminars</h1>
        <p className="page-subtitle mx-auto mt-4 max-w-2xl">
          The Foundations Seminar works through a shared curriculum each year: a concept lecture and
          a hands-on tutorial from the NABI book in every session.
        </p>
      </section>

      <div className="container mx-auto max-w-5xl pb-16">
        {groups.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No sessions published yet.</p>
        )}

        {groups.map((group) => (
          <section key={group.year} aria-labelledby={`seminars-${group.year}`} className="mt-12">
            <h2
              id={`seminars-${group.year}`}
              className="border-b-2 border-border pb-3 text-3xl font-bold tracking-tight"
            >
              Foundations Seminar {group.year}
            </h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-2">
              {group.seminars.map((activity) => (
                <SeminarTile key={activity.id} activity={activity} now={now} />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  )
}
