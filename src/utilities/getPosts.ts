import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

const postCardSelect = {
  title: true,
  slug: true,
  categories: true,
  meta: true,
} as const
const postsSortByPublishedDate = '-publishedAt' as const
const postsCacheVersion = 'published-at-sort-v2' as const

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

type CategorySummary = {
  id: number
  slug?: string | null
  title: string
}

const normalizeSearchQuery = (searchQuery?: string): string => searchQuery?.trim() || ''
const normalizeCategorySlug = (slug: string): string => slug.trim()

async function getCategoryBySlug(slug: string): Promise<CategorySummary | null> {
  const payload = await getPayload({ config: configPromise })
  const normalizedSlug = normalizeCategorySlug(slug)

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

  return (categories.docs[0] as CategorySummary | undefined) || null
}

async function getPostsPage({ limit = POSTS_PER_PAGE, page = 1, searchQuery = '' }: PostsPageArgs) {
  const payload = await getPayload({ config: configPromise })
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery)

  return payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    page,
    sort: postsSortByPublishedDate,
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
  const normalizedSlug = normalizeCategorySlug(slug)
  const category = await getCachedCategoryBySlug(normalizedSlug)()
  if (!category) return null

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    page,
    sort: postsSortByPublishedDate,
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
    postsCacheVersion,
    'posts-page',
    String(limit),
    String(page),
    normalizedSearchQuery,
  ], {
    tags: ['posts_list'],
  })
}

export const getCachedCategoryPostsPage = ({ limit = POSTS_PER_PAGE, page = 1, slug }: CategoryPostsPageArgs) => {
  const normalizedSlug = normalizeCategorySlug(slug)

  return unstable_cache(() => getCategoryPostsPage({ limit, page, slug: normalizedSlug }), [
    postsCacheVersion,
    'category-posts-page',
    normalizedSlug,
    String(limit),
    String(page),
  ], {
    tags: ['posts_by_category', `posts_by_category_${normalizedSlug}`],
  })
}

export const getCachedCategoryBySlug = (slug: string) => {
  const normalizedSlug = normalizeCategorySlug(slug)

  return unstable_cache(() => getCategoryBySlug(normalizedSlug), ['category-by-slug', normalizedSlug], {
    revalidate: 600,
    tags: ['posts_by_category', `posts_by_category_${normalizedSlug}`],
  })
}
