import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedPostsPage, POSTS_PER_PAGE } from '@/utilities/getPosts'
import React from 'react'

export const revalidate = 3600

export default async function Page() {
  const posts = await getCachedPostsPage({ limit: POSTS_PER_PAGE, page: 1 })()

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
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    description: 'Deep dives, meeting summaries, and notes from NABI.',
    path: '/posts',
    title: 'Posts',
  })
}
