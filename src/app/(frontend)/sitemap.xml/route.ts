import { getServerSideSitemapIndex } from 'next-sitemap'

import { getServerSideURL } from '@/utilities/getURL'

export async function GET() {
  const siteURL = getServerSideURL().replace(/\/$/, '')

  return getServerSideSitemapIndex([`${siteURL}/site-sitemap.xml`, `${siteURL}/posts-sitemap.xml`])
}
