import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import Link from 'next/link'

export const revalidate = 600

type Args = {
  searchParams?: Promise<{
    q?: string
  }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const searchParams = searchParamsPromise ? await searchParamsPromise : {}
  const searchQuery = searchParams?.q?.trim() || ''
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    ...(searchQuery
      ? {
          where: {
            or: [
              { title: { contains: searchQuery } },
              { excerpt: { contains: searchQuery } },
              { 'meta.description': { contains: searchQuery } },
            ],
          },
        }
      : {}),
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
  })

  return (
    <div className="page-shell-wide">
      <PageClient />
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
        <form action="/posts" className="relative w-full sm:w-[260px]" method="get">
          <input
            aria-label="Search posts"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            defaultValue={searchQuery}
            name="q"
            placeholder="Search posts"
            type="text"
          />
        </form>
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
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Posts`,
  }
}
