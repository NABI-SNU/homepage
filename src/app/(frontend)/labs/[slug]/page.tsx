import type { Metadata } from 'next'

import { headers as getRequestHeaders } from 'next/headers'
import { notFound } from 'next/navigation'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import { MathJaxTypeset } from '@/components/MathJax/Typeset'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { TableOfContents } from '@/components/TableOfContents'
import { ResearchNotebookArticle } from '@/components/research/ResearchNotebookArticle'
import { getDraftAccessContext } from '@/utilities/getDraftAccessContext'
import { generateMeta } from '@/utilities/generateMeta'
import {
  findResearchBySlug,
  getCachedPublishedResearchBySlug,
  getCachedResearchSlugs,
} from '@/utilities/getResearchBySlug'
import { formatDateTime } from '@/utilities/formatDateTime'
import { fetchNotebookContent, getUploadDoc, getUploadID } from '@/utilities/notebooks'

export const revalidate = 3600

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const slugs = await getCachedResearchSlugs()()
  return slugs.map((slug) => ({ slug }))
}

export default async function ResearchDetailPage({ params }: Args) {
  const { draft, payload } = await getDraftAccessContext()
  const requestHeaders = await getRequestHeaders()
  const { slug } = await params
  const entry = await queryResearchBySlug(slug)
  if (!entry) notFound()
  const notebookID = getUploadID(entry.notebook)
  const notebookFromRelationship = getUploadDoc(entry.notebook)
  const notebook = notebookFromRelationship?.filename
    ? notebookFromRelationship
    : notebookID
      ? await payload.findByID({
          collection: 'notebooks',
          depth: 0,
          id: notebookID,
          overrideAccess: true,
        })
      : notebookFromRelationship
  const notebookContent =
    notebook?.url || notebook?.filename
      ? await fetchNotebookContent({
          cacheable: !draft,
          filename: notebook.filename,
          requestHeaders,
          url: notebook.url,
        })
      : null

  return (
    <article className="page-shell pb-20 pt-6 md:pt-10">
      {draft && <LivePreviewListener />}
      <MathJaxTypeset selector=".labs-notebook-markdown" />

      <section className="container max-w-6xl relative overflow-hidden rounded-[2rem] bg-linear-to-br from-background via-background to-muted/30 px-6 py-10 md:px-10 md:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_48%)]" />
        <header className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
              Research notebook
            </span>
            {entry.date ? <span>{formatDateTime(entry.date)}</span> : null}
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {entry.title}
          </h1>
          <div className="mx-auto mt-6 h-1 w-28 rounded-full bg-linear-to-r from-primary to-accent" />

          {entry.description ? (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              {entry.description}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {notebook?.filename ? (
              <a
                className="max-w-full overflow-hidden rounded-full border border-border/70 bg-background/80 px-3 py-2 break-all transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                download={notebook.filename}
                href={`/api/labs/${slug}/notebook?download=1`}
              >
                Source: {notebook.filename}
              </a>
            ) : null}
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-2">
              {notebookContent?.cells.length || 0} cells
            </span>
          </div>
        </header>

        {entry.image && typeof entry.image === 'object' ? (
          <div className="relative z-10 mx-auto mt-10 max-w-3xl overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/60 shadow-lg">
            <Media
              imgClassName="h-full w-full object-cover"
              pictureClassName="block aspect-[16/9] h-full w-full"
              resource={entry.image}
              size="(min-width: 1024px) 48rem, 100vw"
            />
          </div>
        ) : null}
      </section>
      <TableOfContents />

      <div className="container max-w-6xl pt-10" data-post-content>
        <div className="mx-auto grid max-w-5xl min-w-0 gap-8">
          <section className="rounded-[2rem] border border-border/60 bg-card/45 px-6 py-7 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.5)] md:px-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Overview
              </span>
            </div>
            <RichText
              className="mx-auto max-w-3xl md:prose-lg prose-headings:scroll-mt-28"
              data={entry.content}
              enableGutter={false}
              enableMathJax
            />
          </section>

          {notebook && notebookContent ? (
            <ResearchNotebookArticle
              downloadURL={`/api/labs/${slug}/notebook?download=1`}
              filename={notebook.filename}
              notebook={notebookContent}
            />
          ) : notebook ? (
            <section className="rounded-[2rem] border border-amber-300/70 bg-amber-50 px-6 py-5 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
              <h2 className="text-lg font-semibold">Notebook preview unavailable</h2>
              <p className="mt-2 text-sm leading-6">
                The source notebook is attached, but its reading view could not be rendered.
              </p>
              <a
                className="mt-4 inline-flex items-center rounded-full border border-current/20 px-4 py-2 text-sm font-medium"
                href={`/api/labs/${slug}/notebook?download=1`}
                rel="noreferrer"
                target="_blank"
              >
                Download source notebook
              </a>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const entry = await queryResearchBySlug(slug)

  return generateMeta({
    description: entry?.description || 'Research note',
    doc: entry
      ? {
          description: entry.description,
          slug: ['labs', slug],
          title: entry.title,
        }
      : null,
    path: `/labs/${slug}`,
    title: entry?.title || 'Research',
  })
}

const queryResearchBySlug = async (slug: string) => {
  const { draft, payload, user } = await getDraftAccessContext()

  if (!draft) {
    return getCachedPublishedResearchBySlug(slug)()
  }

  return findResearchBySlug({
    draft,
    payload,
    slug,
    user,
  })
}
