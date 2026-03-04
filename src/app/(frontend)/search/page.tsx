import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import React from 'react'
import { Search } from '@/search/Component'
import { generateMeta } from '@/utilities/generateMeta'
import { getCachedSearchResults } from '@/utilities/getSearchResults'

type Args = {
  searchParams: Promise<{
    q?: string
  }>
}
export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query } = await searchParamsPromise
  const normalizedQuery = query?.trim() || ''
  const mappedResults = await getCachedSearchResults(normalizedQuery)()
  const hasResults = mappedResults.length > 0

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none text-center">
          <h1 className="mb-8 lg:mb-16">Search</h1>

          <div className="max-w-[50rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {hasResults ? (
        <CollectionArchive posts={mappedResults} />
      ) : (
        <div className="container">No results found.</div>
      )}
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    path: '/search',
    robots: {
      follow: true,
      index: false,
    },
    title: 'Search',
  })
}
