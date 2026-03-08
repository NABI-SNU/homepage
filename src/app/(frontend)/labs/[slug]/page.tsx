import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import { cache } from 'react'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import RichText from '@/components/RichText'
import { TableOfContents } from '@/components/TableOfContents'
import { ResearchNotebookSection } from '@/components/research/ResearchNotebookSection'
import { getDraftAccessContext } from '@/utilities/getDraftAccessContext'
import { generateMeta } from '@/utilities/generateMeta'
import { findResearchBySlug } from '@/utilities/getResearchBySlug'
import { getUploadDoc, getUploadID } from '@/utilities/notebooks'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export default async function ResearchDetailPage({ params }: Args) {
  const { draft, payload } = await getDraftAccessContext()
  const { slug } = await params
  const entry = await queryResearchBySlug({ slug })
  if (!entry) notFound()
  const notebookID = getUploadID(entry.notebook)
  const notebook =
    getUploadDoc(entry.notebook) ||
    (notebookID
      ? await payload.findByID({
          collection: 'notebooks',
          depth: 0,
          id: notebookID,
          overrideAccess: true,
        })
      : null)

  return (
    <article className="pb-20 pt-6 md:pt-10">
      {draft && <LivePreviewListener />}
      <section className="relative pt-8 md:pt-12">
        <div className="container">
          <header className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              {entry.title}
            </h1>
            <div className="mt-6 h-1 w-28 rounded-full bg-linear-to-r from-primary to-accent" />
            {entry.description && (
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
                {entry.description}
              </p>
            )}
          </header>
        </div>
      </section>
      <TableOfContents />

      <div className="flex flex-col items-center gap-4 pt-10">
        <div className="container">
          <div data-post-content>
            <RichText
              className="mx-auto max-w-3xl md:prose-lg prose-headings:scroll-mt-28"
              data={entry.content}
              enableGutter={false}
              enableMathJax
            />
          </div>

          {notebook ? (
            <div className="mx-auto max-w-[67rem]">
              <ResearchNotebookSection
                apiURL={`/api/labs/${slug}/notebook`}
                colabURL={entry.colabURL}
                downloadURL={`/api/labs/${slug}/notebook?download=1`}
                filename={notebook.filename}
                kaggleURL={entry.kaggleURL}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const entry = await queryResearchBySlug({ slug })

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

const queryResearchBySlug = cache(async ({ slug }: { slug: string }) => {
  const { draft, payload, user } = await getDraftAccessContext()
  return findResearchBySlug({
    draft,
    payload,
    slug,
    user,
  })
})
