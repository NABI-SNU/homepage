import type { Metadata } from 'next'

import { CollectionArchive } from '@/components/CollectionArchive'
import { notFound } from 'next/navigation'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedTopicPageData, getCachedTopicsList } from '@/utilities/getTopics'

export const revalidate = 3600

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const slugs = await getCachedTopicsList()()
  return slugs.map((slug) => ({ slug }))
}

export default async function TopicPage({ params }: Args) {
  const { slug } = await params
  const { posts, topic: tag } = await getCachedTopicPageData(slug)()
  if (!tag) notFound()

  return (
    <main className="pb-20 pt-12">
      <section className="container mb-10">
        <h1 className="text-4xl font-semibold">Topic: {tag.title}</h1>
      </section>
      <CollectionArchive posts={posts} />
    </main>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const { topic: tag } = await getCachedTopicPageData(slug)()
  const title = tag?.title || slug

  return generateMeta({
    description: `Posts filed under topic ${title}.`,
    path: `/topics/${slug}`,
    title: `Topic: ${title}`,
  })
}
