import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 600

type Args = {
  params: Promise<{
    pageNumber: string
  }>
  searchParams?: Promise<{
    q?: string
  }>
}

export default async function Page({ params: paramsPromise, searchParams: searchParamsPromise }: Args) {
  const { pageNumber } = await paramsPromise
  const searchParams = searchParamsPromise ? await searchParamsPromise : {}
  const searchQuery = searchParams?.q?.trim() || ''
  const payload = await getPayload({ config: configPromise })

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    page: sanitizedPageNumber,
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
  })

  return (
    <div className="pb-24 pt-16">
      <PageClient />
      <div className="container mb-12">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">Articles</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Posts</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Deep dives, meeting summaries, and notes from NABI.
        </p>
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
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber } = await paramsPromise
  return {
    title: `Payload Website Template Posts Page ${pageNumber || ''}`,
  }
}
