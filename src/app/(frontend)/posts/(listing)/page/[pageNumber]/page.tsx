import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedPostsPage, POSTS_PER_PAGE } from '@/utilities/getPosts'
import React from 'react'
import { notFound } from 'next/navigation'

export const revalidate = 3600

type Args = {
  params: Promise<{
    pageNumber: string
  }>
}

export async function generateStaticParams() {
  try {
    const { totalPages } = await getCachedPostsPage({ limit: POSTS_PER_PAGE, page: 1 })()
    return Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => ({
      pageNumber: String(index + 2),
    }))
  } catch {
    return []
  }
}

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber } = await paramsPromise
  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber) || sanitizedPageNumber < 1) notFound()

  const posts = await getCachedPostsPage({ limit: POSTS_PER_PAGE, page: sanitizedPageNumber })()

  // Past the last page: 404 instead of an empty list (pages 2+ only exist when totalPages allows).
  if (sanitizedPageNumber > Math.max(posts.totalPages, 1)) notFound()

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
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </>
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
