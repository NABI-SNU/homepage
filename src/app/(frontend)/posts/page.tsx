import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostsSearchInput } from '@/components/PostsSearchInput'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedPostsPage, POSTS_PER_PAGE } from '@/utilities/getPosts'
import React from 'react'
import Link from 'next/link'

export const revalidate = 3600

type Args = {
  searchParams?: Promise<{
    q?: string
  }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const searchParams = searchParamsPromise ? await searchParamsPromise : {}
  const searchQuery = searchParams?.q?.trim() || ''
  const posts = await getCachedPostsPage({
    limit: POSTS_PER_PAGE,
    page: 1,
    searchQuery,
  })()

  return (
    <div className="page-shell-wide">
      <div className="container">
        <div className="page-header mb-12 text-center">
          <p className="page-eyebrow">Articles</p>
          <h1 className="page-title">Posts</h1>
          <p className="page-subtitle mx-auto max-w-2xl">
            Deep dives, meeting summaries, and notes from NABI.
          </p>
        </div>
      </div>

      <div className="container mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <PostsSearchInput className="relative w-full sm:w-[260px]" initialValue={searchQuery} />
        {searchQuery && (
          <Link
            href="/posts"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            Clear search
          </Link>
        )}
      </div>

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
            query={searchQuery ? { q: searchQuery } : undefined}
            totalPages={posts.totalPages}
          />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    description: 'Deep dives, meeting summaries, and notes from NABI.',
    path: '/posts',
    title: 'Posts',
  })
}
