import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import type { Post } from '@/payload-types'

export const postCardSelect = {
  title: true,
  slug: true,
  categories: true,
  meta: true,
} as const
const postSlugSelect = {
  slug: true,
} as const
const postDetailSelect = {
  id: true,
  title: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  excerpt: true,
  publishedAt: true,
  content: true,
  authors: true,
  categories: true,
  heroImage: true,
  references: true,
  relatedPosts: true,
  tags: true,
  meta: true,
} as const
const postsSortByPublishedDate = '-publishedAt' as const
const postsCacheVersion = 'published-at-sort-v3' as const
const postDetailDepth = 2 as const
const publishedPostsWhere = {
  _status: {
    equals: 'published' as const,
  },
}

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

type PublishedPostDetail = Pick<
  Post,
  | 'authors'
  | 'categories'
  | 'content'
  | 'createdAt'
  | 'excerpt'
  | 'heroImage'
  | 'id'
  | 'meta'
  | 'publishedAt'
  | 'references'
  | 'relatedPosts'
  | 'slug'
  | 'tags'
  | 'title'
  | 'updatedAt'
>

const normalizeSearchQuery = (searchQuery?: string): string => searchQuery?.trim() || ''
const normalizeCategorySlug = (slug: string): string => slug.trim()
const normalizePostSlug = (slug: string): string => slug.trim()

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
    overrideAccess: false,
    select: postCardSelect,
    where: normalizedSearchQuery
      ? {
          and: [
            publishedPostsWhere,
            {
              or: [
                { title: { contains: normalizedSearchQuery } },
                { excerpt: { contains: normalizedSearchQuery } },
                { 'meta.description': { contains: normalizedSearchQuery } },
              ],
            },
          ],
        }
      : publishedPostsWhere,
  })
}

async function getCategoryPostsPage({
  limit = POSTS_PER_PAGE,
  page = 1,
  slug,
}: CategoryPostsPageArgs) {
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

async function getPublishedPostBySlug(slug: string): Promise<PublishedPostDetail | null> {
  const payload = await getPayload({ config: configPromise })
  const normalizedSlug = normalizePostSlug(slug)
  const result = await payload.find({
    collection: 'posts',
    depth: postDetailDepth,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    select: postDetailSelect,
    where: {
      and: [
        publishedPostsWhere,
        {
          slug: {
            equals: normalizedSlug,
          },
        },
      ],
    },
  })

  return (result.docs[0] as PublishedPostDetail | undefined) || null
}

async function getRecentPosts(
  limit: number,
): Promise<Array<Pick<Post, 'categories' | 'id' | 'meta' | 'slug' | 'title'>>> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit,
    overrideAccess: false,
    pagination: false,
    select: {
      id: true,
      ...postCardSelect,
    },
    sort: postsSortByPublishedDate,
    where: publishedPostsWhere,
  })

  return result.docs as Array<Pick<Post, 'categories' | 'id' | 'meta' | 'slug' | 'title'>>
}

async function getPostSlugs(): Promise<string[]> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: postSlugSelect,
    sort: postsSortByPublishedDate,
    where: publishedPostsWhere,
  })

  return result.docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}

export const getCachedPostsPage = ({
  limit = POSTS_PER_PAGE,
  page = 1,
  searchQuery = '',
}: PostsPageArgs) => {
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery)

  return unstable_cache(
    () => getPostsPage({ limit, page, searchQuery: normalizedSearchQuery }),
    [postsCacheVersion, 'posts-page', String(limit), String(page), normalizedSearchQuery],
    {
      revalidate: 3600,
      tags: ['posts_list'],
    },
  )
}

export const getCachedCategoryPostsPage = ({
  limit = POSTS_PER_PAGE,
  page = 1,
  slug,
}: CategoryPostsPageArgs) => {
  const normalizedSlug = normalizeCategorySlug(slug)

  return unstable_cache(
    () => getCategoryPostsPage({ limit, page, slug: normalizedSlug }),
    [postsCacheVersion, 'category-posts-page', normalizedSlug, String(limit), String(page)],
    {
      revalidate: 3600,
      tags: ['posts_by_category', `posts_by_category_${normalizedSlug}`],
    },
  )
}

export const getCachedCategoryBySlug = (slug: string) => {
  const normalizedSlug = normalizeCategorySlug(slug)

  return unstable_cache(
    () => getCategoryBySlug(normalizedSlug),
    ['category-by-slug', normalizedSlug],
    {
      revalidate: 3600,
      tags: ['posts_by_category', `posts_by_category_${normalizedSlug}`],
    },
  )
}

export const getCachedPublishedPostBySlug = (slug: string) => {
  const normalizedSlug = normalizePostSlug(slug)

  return unstable_cache(
    () => getPublishedPostBySlug(normalizedSlug),
    [postsCacheVersion, 'post-by-slug', normalizedSlug],
    {
      revalidate: 3600,
      tags: [`post_${normalizedSlug}`],
    },
  )
}

export const getCachedRecentPosts = (limit = 6) =>
  unstable_cache(() => getRecentPosts(limit), [postsCacheVersion, 'recent-posts', String(limit)], {
    revalidate: 3600,
    tags: ['recent_posts'],
  })

export const getCachedPostSlugs = () =>
  unstable_cache(getPostSlugs, [postsCacheVersion, 'post-slugs'], {
    revalidate: 3600,
    tags: ['posts_list', 'posts-sitemap'],
  })
