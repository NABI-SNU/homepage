import type { Metadata } from 'next'

import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import { getCachedAnnouncementsList } from '@/utilities/getAnnouncements'

export const revalidate = 3600

export default async function AnnouncementsPage() {
  const announcements = await getCachedAnnouncementsList()()

  const items = announcements.map((item) => {
    const image = item.image && typeof item.image === 'object' ? item.image : null
    const metaImage =
      item.meta?.image && typeof item.meta.image === 'object' ? item.meta.image : null

    return {
      slug: item.slug,
      title: item.title,
      date: item.publishedAt,
      relationTo: 'announcements' as const,
      meta: {
        ...(item.meta || {}),
        description: item.meta?.description || item.description,
        image: metaImage || image,
      },
    }
  })

  return (
    <div className="page-shell-wide">
      <div className="page-header container mb-12 text-center">
        <p className="page-eyebrow">Activities</p>
        <h1 className="page-title">Announcements</h1>
        <p className="page-subtitle mx-auto max-w-2xl">
          Standalone updates, notices, and schedule changes from NABI.
        </p>
      </div>

      <CollectionArchive posts={items} relationTo="announcements" showCategories={false} showDate />

      {items.length === 0 && (
        <p className="container mt-6 text-sm text-muted-foreground">
          No announcements have been published yet.
        </p>
      )}
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Announcements',
  description: 'Standalone updates, notices, and schedule changes from NABI.',
}
