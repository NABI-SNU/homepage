import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedPostsPage, POSTS_PER_PAGE } from '@/utilities/getPosts'
import { redirect } from 'next/navigation'
import React from 'react'

type Args = {
  searchParams?: Promise<{
    page?: string
    q?: string
  }>
}

export default async function PostsSearchPage({ searchParams: searchParamsPromise }: Args) {
  const searchParams = searchParamsPromise ? await searchParamsPromise : {}
  const searchQuery = searchParams?.q?.trim() || ''
  const requestedPage = Number(searchParams?.page)
  const page = Number.isInteger(requestedPage) && requestedPage > 1 ? requestedPage : 1

  if (!searchQuery) redirect('/posts')

  const posts = await getCachedPostsPage({ limit: POSTS_PER_PAGE, page, searchQuery })()

  return (
    <>
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
            pageAsQuery
            pathPrefix="/posts/search"
            query={{ q: searchQuery }}
            totalPages={posts.totalPages}
          />
        )}
      </div>
    </>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    path: '/posts/search',
    robots: {
      follow: true,
      index: false,
    },
    title: 'Search posts',
  })
}
