import React, { Suspense } from 'react'

import { PostsSearchInput, PostsSearchInputFallback } from '@/components/PostsSearchInput'

const searchClassName = 'relative w-full sm:w-[260px]'

export default function PostsListingLayout({ children }: { children: React.ReactNode }) {
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
        <Suspense fallback={<PostsSearchInputFallback className={searchClassName} />}>
          <PostsSearchInput className={searchClassName} />
        </Suspense>
      </div>

      {children}
    </div>
  )
}
