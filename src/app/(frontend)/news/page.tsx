import type { Metadata } from 'next'

import { NewsArchive } from '@/components/NewsArchive'
import { getCachedNewsArchiveDataset } from '@/utilities/getNews'
import React from 'react'

export const revalidate = 3600

export default async function NewsPage() {
  const archive = await getCachedNewsArchiveDataset()()

  return <NewsArchive activeYear={archive.years[0] ?? null} archive={archive} />
}

export const metadata: Metadata = {
  title: 'News',
  description:
    'Monthly highlights featuring curated research papers and resources in computational neuroscience and AI.',
}
