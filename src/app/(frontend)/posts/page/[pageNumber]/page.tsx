import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PostsSearchInput } from '@/components/PostsSearchInput'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedPostsPage, POSTS_PER_PAGE } from '@/utilities/getPosts'
import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 3600

type Args = {
  params: Promise<{
    pageNumber: string
  }>
  searchParams?: Promise<{
    q?: string
  }>
}

export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { pageNumber } = await paramsPromise
  const searchParams = searchParamsPromise ? await searchParamsPromise : {}
  const searchQuery = searchParams?.q?.trim() || ''

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber) || sanitizedPageNumber < 1) notFound()

  const posts = await getCachedPostsPage({
    limit: POSTS_PER_PAGE,
    page: sanitizedPageNumber,
    searchQuery,
  })()

  return (
    <div className="pb-24 pt-16">
      <div className="container mb-12">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Articles</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Posts</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Deep dives, meeting summaries, and notes from NABI.
        </p>
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
        {posts?.page && posts?.totalPages > 1 && (
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

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return generateMeta({
    description: `Deep dives, meeting summaries, and notes from NABI. Page ${pageNumber}.`,
    path: `/posts/page/${pageNumber}`,
    title: `Posts - Page ${pageNumber || ''}`,
  })
}
