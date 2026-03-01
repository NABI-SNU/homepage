import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'

export const revalidate = 600

export default async function ResearchListPage() {
  const payload = await getPayload({ config: configPromise })

  const research = await payload.find({
    collection: 'research',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: '-date',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return (
    <main className="page-shell">
      <section className="container page-header text-center">
        <p className="page-eyebrow">Research</p>
        <h1 className="page-title-lg">Notebooks and notes</h1>
      </section>

      <section className="container section-gap grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {research.docs.map((item) => (
          <Link
            key={item.id}
            href={`/labs/${item.slug}`}
            className="rounded-2xl border border-border/80 bg-card/70 p-6 transition hover:border-primary/30 hover:bg-muted/80"
          >
            <h2 className="text-2xl font-semibold">{item.title}</h2>
            {item.description && (
              <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
            )}
          </Link>
        ))}
      </section>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Research',
  description:
    'Research notes from NABI, the Natural and Artificial Brain Intelligence study group.',
}
