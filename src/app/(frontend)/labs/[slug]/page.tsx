import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import fs from 'node:fs/promises'
import path from 'node:path'

import RichText from '@/components/RichText'
import { TableOfContents } from '@/components/TableOfContents'

const workspaceRoot = process.cwd()

type Args = {
  params: Promise<{
    slug: string
  }>
}

export default async function ResearchDetailPage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const research = await payload.find({
    collection: 'research',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  const entry = research.docs[0]
  if (!entry) notFound()

  let notebookExists = false
  let notebookPreview = ''

  if (entry.notebookPath) {
    const absoluteNotebookPath = path.resolve(workspaceRoot, entry.notebookPath)
    try {
      const notebookRaw = await fs.readFile(absoluteNotebookPath, 'utf8')
      const notebookJSON = JSON.parse(notebookRaw) as {
        cells?: { cell_type?: string; source?: string[] | string }[]
      }

      const previewSource = (notebookJSON.cells || [])
        .slice(0, 3)
        .map((cell) => {
          if (!cell?.source) return ''
          if (Array.isArray(cell.source)) return cell.source.join('')
          return cell.source
        })
        .filter(Boolean)
        .join('\n\n')

      notebookExists = true
      notebookPreview = previewSource.slice(0, 2000)
    } catch {
      notebookExists = false
    }
  }

  return (
    <article className="pb-20 pt-12">
      <header className="container max-w-4xl">
        <h1 className="text-5xl font-semibold">{entry.title}</h1>
        <div className="mt-6 h-1 w-24 rounded-full bg-linear-to-r from-primary to-accent" />
        {entry.description && <p className="mt-4 text-lg text-muted-foreground">{entry.description}</p>}
      </header>
      <TableOfContents />

      <div className="container mt-10 max-w-4xl">
        <div data-post-content>
          <RichText className="prose-headings:scroll-mt-28" data={entry.content} enableGutter={false} />
        </div>

        {entry.notebookPath && (
          <section className="mt-10 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Notebook</h2>
            <p className="mt-2 text-sm text-muted-foreground">{entry.notebookPath}</p>
            {notebookExists ? (
              <div className="mt-4 rounded-xl border border-border bg-background p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Notebook Preview</p>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{notebookPreview || 'Notebook is empty.'}</pre>
              </div>
            ) : (
              <p className="mt-3 text-sm text-amber-600">Notebook file not found in workspace.</p>
            )}
          </section>
        )}
      </div>
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const research = await payload.find({
    collection: 'research',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })
  const entry = research.docs[0]

  return {
    title: entry?.title || 'Research',
    description: entry?.description || 'Research note',
  }
}
