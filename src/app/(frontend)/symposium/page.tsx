import type { Metadata } from 'next'

import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import { getCachedSymposiumCards } from '@/utilities/activityCache'

export const revalidate = 3600

export default async function SymposiumPage() {
  const mappedSymposium = await getCachedSymposiumCards()()

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
