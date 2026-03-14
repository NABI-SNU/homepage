import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { postCardSelect } from '@/utilities/getPosts'
import type { Post } from '@/payload-types'

type TopicSummary = {
  id: number
  slug: string
  title: string
}

type TopicPageData = {
  posts: Array<Pick<Post, 'categories' | 'id' | 'meta' | 'slug' | 'title'>>
  topic: TopicSummary | null
}

const topicSelect = {
  id: true,
  slug: true,
  title: true,
} as const
const normalizeTopicSlug = (slug: string): string => slug.trim()

const getTopicsList = async (): Promise<string[]> => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'tags',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
    sort: 'title',
  })

  return result.docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}

const getTopicPageData = async (slug: string): Promise<TopicPageData> => {
  const payload = await getPayload({ config: configPromise })
  const normalizedSlug = normalizeTopicSlug(slug)
  const tags = await payload.find({
    collection: 'tags',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: topicSelect,
    where: {
      slug: {
        equals: normalizedSlug,
      },
    },
  })

  const topic = (tags.docs[0] as TopicSummary | undefined) || null
  if (!topic) {
    return {
      posts: [],
      topic: null,
    }
  }

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    select: {
      id: true,
      ...postCardSelect,
    },
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          tags: {
            contains: topic.id,
          },
        },
      ],
    },
  })

  return {
    posts: posts.docs as TopicPageData['posts'],
    topic,
  }
}

export const getCachedTopicsList = () =>
  unstable_cache(getTopicsList, ['topics-list'], {
    revalidate: 3600,
    tags: ['topics_list'],
  })

export const getCachedTopicPageData = (slug: string) => {
  const normalizedSlug = normalizeTopicSlug(slug)

  return unstable_cache(
    () => getTopicPageData(normalizedSlug),
    ['topic-page-data', normalizedSlug],
    {
      revalidate: 3600,
      tags: [`topic_${normalizedSlug}`, 'topic_posts'],
    },
  )
}
