import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'

export const revalidate = 600

export default async function SymposiumPage() {
  const payload = await getPayload({ config: configPromise })

  const symposium = await payload.find({
    collection: 'activities',
    depth: 1,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    sort: '-date',
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          activityType: {
            equals: 'symposium',
          },
        },
      ],
    },
    select: {
      title: true,
      slug: true,
      date: true,
      heroImage: true,
      meta: true,
      description: true,
    },
  })

  const mappedSymposium = symposium.docs.map((item) => {
    const heroImage = item.heroImage && typeof item.heroImage === 'object' ? item.heroImage : null
    const metaImage = item.meta?.image && typeof item.meta.image === 'object' ? item.meta.image : null

    return {
      slug: item.slug,
      title: item.title,
      date: item.date,
      relationTo: 'symposium' as const,
      meta: {
        ...(item.meta || {}),
        description: item.meta?.description || item.description,
        image: metaImage || heroImage,
      },
    }
  })

  return (
    <div className="page-shell-wide">
      <div className="page-header container mb-12 text-center">
        <p className="page-eyebrow">Activities</p>
        <h1 className="page-title">Symposium</h1>
        <p className="page-subtitle mx-auto max-w-2xl">
          NABI symposium posters, sessions, and highlights.
        </p>
      </div>

      <CollectionArchive
        posts={mappedSymposium}
        relationTo="symposium"
        showCategories={false}
        showDate
        cardImageAspect="portrait"
      />
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Symposium',
  description: 'NABI symposium posters, sessions, and highlights.',
}
