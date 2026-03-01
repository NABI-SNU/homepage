import type { Metadata } from 'next'

import { CollectionArchive } from '@/components/CollectionArchive'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryPage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const category = categories.docs[0]
  if (!category) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          categories: {
            contains: category.id,
          },
        },
      ],
    },
  })

  return (
    <main className="pb-20 pt-12">
      <section className="container mb-10">
        <h1 className="text-4xl font-semibold">Category: {category.title}</h1>
      </section>
      <CollectionArchive posts={posts.docs} />
    </main>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `Category: ${slug}`,
  }
}
