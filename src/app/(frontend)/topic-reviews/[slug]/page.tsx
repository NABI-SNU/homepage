import type { Metadata } from 'next'

import React from 'react'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { ProgramActivityDetail } from '@/components/Program/ProgramActivityDetail'
import {
  getCachedActivityBySlugAndType,
  getCachedActivitySlugsByType,
} from '@/utilities/activityCache'
import { generateMeta } from '@/utilities/generateMeta'

export const revalidate = 3600

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export async function generateStaticParams() {
  const slugs = await getCachedActivitySlugsByType('topic-review')()
  return slugs.map((slug) => ({ slug }))
}

export default async function TopicReviewDetailPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = '/topic-reviews/' + decodedSlug
  const entry = await getCachedActivityBySlugAndType({
    activityType: 'topic-review',
    depth: 1,
    slug: decodedSlug,
  })()

  if (!entry) {
    return <PayloadRedirects url={url} />
  }

  return <ProgramActivityDetail entry={entry} url={url} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const entry = await getCachedActivityBySlugAndType({
    activityType: 'topic-review',
    depth: 1,
    slug: decodedSlug,
  })()

  return generateMeta({
    description: entry?.description || 'NABI Topic Review',
    doc: entry
      ? {
          meta: {
            description: entry.meta?.description || entry.description,
            image:
              entry.meta?.image && typeof entry.meta.image === 'object' ? entry.meta.image : null,
            title: entry.meta?.title || entry.title,
          },
          slug: ['topic-reviews', decodedSlug],
          title: entry.title,
        }
      : null,
    path: `/topic-reviews/${decodedSlug}`,
    title: entry?.title || 'Topic Review',
  })
}
