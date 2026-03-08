import type { Metadata } from 'next'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

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

  const cards = research.docs.map((item) => ({
    meta: {
      description: item.description,
      image: item.image,
    },
    relationTo: 'labs' as const,
    slug: item.slug,
    title: item.title,
  }))

  return (
    <main className="page-shell">
      <section className="container page-header text-center">
        <p className="page-eyebrow">Research</p>
        <h1 className="page-title-lg">Notebooks and notes</h1>
      </section>

      <div className="section-gap">
        <CollectionArchive posts={cards} relationTo="labs" showCategories={false} />
      </div>
    </main>
  )
}

export const metadata: Metadata = {
  title: 'Research',
  description:
    'Research notes from NABI, the Natural and Artificial Brain Intelligence study group.',
}
