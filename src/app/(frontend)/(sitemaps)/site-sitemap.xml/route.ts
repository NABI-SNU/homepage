import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'

const getSiteSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config })
    const SITE_URL =
      process.env.NEXT_PUBLIC_SERVER_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      'https://example.com'

    const [peopleResults, newsResults, researchResults] = await Promise.all([
      payload.find({
        collection: 'people',
        overrideAccess: false,
        depth: 0,
        limit: 1000,
        pagination: false,
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
      payload.find({
        collection: 'news',
        overrideAccess: false,
        draft: false,
        depth: 0,
        limit: 1000,
        pagination: false,
        where: {
          _status: {
            equals: 'published',
          },
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
      payload.find({
        collection: 'research',
        overrideAccess: false,
        draft: false,
        depth: 0,
        limit: 1000,
        pagination: false,
        where: {
          _status: {
            equals: 'published',
          },
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
    ])

    const dateFallback = new Date().toISOString()

    const defaultSitemap = [
      {
        loc: `${SITE_URL}/search`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/posts`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/about`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/contact`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/people`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/news`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/labs`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/references`,
        lastmod: dateFallback,
      },
      {
        loc: `${SITE_URL}/symposium`,
        lastmod: dateFallback,
      },
    ]

    const peopleSitemap = peopleResults.docs
      ? peopleResults.docs
          .filter((person) => Boolean(person?.slug))
          .map((person) => ({
            loc: `${SITE_URL}/people/${person.slug}`,
            lastmod: person.updatedAt || dateFallback,
          }))
      : []

    const newsSitemap = newsResults.docs
      ? newsResults.docs
          .filter((item) => Boolean(item?.slug))
          .map((item) => ({
            loc: `${SITE_URL}/news/${item.slug}`,
            lastmod: item.updatedAt || dateFallback,
          }))
      : []

    const researchSitemap = researchResults.docs
      ? researchResults.docs
          .filter((item) => Boolean(item?.slug))
          .map((item) => ({
            loc: `${SITE_URL}/labs/${item.slug}`,
            lastmod: item.updatedAt || dateFallback,
          }))
      : []

    return [...defaultSitemap, ...peopleSitemap, ...newsSitemap, ...researchSitemap]
  },
  ['site-sitemap'],
  {
    tags: ['site-sitemap'],
  },
)

export async function GET() {
  const sitemap = await getSiteSitemap()

  return getServerSideSitemap(sitemap)
}
