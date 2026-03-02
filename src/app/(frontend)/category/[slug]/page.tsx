import type { Metadata } from 'next'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { getCachedCategoryPostsPage, POSTS_PER_PAGE } from '@/utilities/getPosts'
import { generateMeta } from '@/utilities/generateMeta'
import { notFound } from 'next/navigation'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryPage({ params }: Args) {
  const { slug } = await params
  const categoryPosts = await getCachedCategoryPostsPage({
    limit: POSTS_PER_PAGE,
    page: 1,
    slug,
  })()

  if (!categoryPosts) notFound()

  const { category, posts } = categoryPosts

  return (
    <main className="pb-20 pt-12">
      <section className="container mb-10">
        <h1 className="text-4xl font-semibold">Category: {category.title}</h1>
      </section>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={POSTS_PER_PAGE}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination
            page={posts.page}
            pathPrefix={`/category/${category.slug}`}
            totalPages={posts.totalPages}
          />
        )}
      </div>
    </main>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const categoryPosts = await getCachedCategoryPostsPage({
    limit: POSTS_PER_PAGE,
    page: 1,
    slug,
  })()
  const title = categoryPosts?.category?.title || slug

  return generateMeta({
    description: `Posts filed under ${title}.`,
    path: `/category/${slug}`,
    title: `Category: ${title}`,
  })
}
