import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

const postCardSelect = {
  title: true,
  slug: true,
  categories: true,
  meta: true,
} as const

export const POSTS_PER_PAGE = 12

type PostsPageArgs = {
  limit?: number
  page?: number
  searchQuery?: string
}

type CategoryPostsPageArgs = {
  limit?: number
  page?: number
  slug: string
}

const normalizeSearchQuery = (searchQuery?: string): string => searchQuery?.trim() || ''

async function getPostsPage({ limit = POSTS_PER_PAGE, page = 1, searchQuery = '' }: PostsPageArgs) {
  const payload = await getPayload({ config: configPromise })
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery)

  return payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    page,
    ...(normalizedSearchQuery
      ? {
          where: {
            or: [
              { title: { contains: normalizedSearchQuery } },
              { excerpt: { contains: normalizedSearchQuery } },
              { 'meta.description': { contains: normalizedSearchQuery } },
            ],
          },
        }
      : {}),
    overrideAccess: false,
    select: postCardSelect,
  })
}

async function getCategoryPostsPage({ limit = POSTS_PER_PAGE, page = 1, slug }: CategoryPostsPageArgs) {
  const payload = await getPayload({ config: configPromise })
  const normalizedSlug = slug.trim()

  const categories = await payload.find({
    collection: 'categories',
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: {
      id: true,
      slug: true,
      title: true,
    },
    where: {
      slug: {
        equals: normalizedSlug,
      },
    },
  })

  const category = categories.docs[0]
  if (!category) return null

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    page,
    overrideAccess: false,
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
    select: postCardSelect,
  })

  return {
    category,
    posts,
  }
}

export const getCachedPostsPage = ({ limit = POSTS_PER_PAGE, page = 1, searchQuery = '' }: PostsPageArgs) => {
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery)

  return unstable_cache(() => getPostsPage({ limit, page, searchQuery: normalizedSearchQuery }), [
    'posts-page',
    String(limit),
    String(page),
    normalizedSearchQuery,
  ], {
    tags: ['posts_list'],
  })
}

export const getCachedCategoryPostsPage = ({ limit = POSTS_PER_PAGE, page = 1, slug }: CategoryPostsPageArgs) => {
  const normalizedSlug = slug.trim()

  return unstable_cache(() => getCategoryPostsPage({ limit, page, slug: normalizedSlug }), [
    'category-posts-page',
    normalizedSlug,
    String(limit),
    String(page),
  ], {
    tags: ['posts_by_category', `posts_by_category_${normalizedSlug}`],
  })
}
