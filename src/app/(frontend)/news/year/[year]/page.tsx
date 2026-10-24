import type { Metadata } from 'next'

import { NewsArchive } from '@/components/NewsArchive'
import { getCachedNewsArchiveDataset } from '@/utilities/getNews'
import { notFound } from 'next/navigation'
import React from 'react'

export const revalidate = 3600

type Args = {
  params: Promise<{
    year: string
  }>
}

export async function generateStaticParams() {
  try {
    const { years } = await getCachedNewsArchiveDataset()()
    return years.map((year) => ({ year: String(year) }))
  } catch {
    return []
  }
}

export default async function NewsYearPage({ params: paramsPromise }: Args) {
  const { year } = await paramsPromise
  const archive = await getCachedNewsArchiveDataset()()
  const activeYear = Number(year)

  if (!archive.years.includes(activeYear)) notFound()

  return <NewsArchive activeYear={activeYear} archive={archive} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { year } = await paramsPromise

  return {
    title: `News ${year}`,
    description: `Monthly highlights from ${year} featuring curated research papers and resources in computational neuroscience and AI.`,
  }
}
