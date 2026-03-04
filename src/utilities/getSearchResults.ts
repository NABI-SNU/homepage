import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Search } from '@/payload-types'
import { mapSearchResultsToCardDocs } from '@/search/mapSearchResultsToCardDocs'
import type { PayloadLike } from '@/search/mapSearchResultsToCardDocs'

type SearchResult = Pick<Search, 'doc' | 'meta' | 'slug' | 'title' | 'categories'>

const normalizeSearchQuery = (query?: string): string => query?.trim() || ''

const getSearchResults = async (query?: string) => {
  const normalizedQuery = normalizeSearchQuery(query)
  const payload = await getPayload({ config: configPromise })

  const results = await payload.find({
    collection: 'search',
    depth: 0,
    limit: 12,
    overrideAccess: false,
    pagination: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      doc: true,
    },
    ...(normalizedQuery
      ? {
          where: {
            or: [
              {
                title: {
                  like: normalizedQuery,
                },
              },
              {
                'meta.description': {
                  like: normalizedQuery,
                },
              },
              {
                'meta.title': {
                  like: normalizedQuery,
                },
              },
              {
                slug: {
                  like: normalizedQuery,
                },
              },
            ],
          },
        }
      : {}),
  })

  if (results.docs.length === 0) return []

  return mapSearchResultsToCardDocs({
    payload: payload as unknown as PayloadLike,
    results: results.docs as SearchResult[],
  })
}

export const getCachedSearchResults = (query?: string) => {
  const normalizedQuery = normalizeSearchQuery(query)

  return unstable_cache(() => getSearchResults(normalizedQuery), ['search-results', normalizedQuery], {
    revalidate: 300,
    tags: ['search_results'],
  })
}
