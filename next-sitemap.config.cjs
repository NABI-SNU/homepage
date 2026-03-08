const rawSiteUrl =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null) ||
  'https://example.com'

const SITE_URL = rawSiteUrl.replace(/\/$/, '')

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  generateIndexSitemap: false,
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  exclude: ['/posts-sitemap.xml', '/site-sitemap.xml', '/sitemap.xml', '/*', '/posts/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: '/admin/*',
      },
    ],
    additionalSitemaps: [`${SITE_URL}/site-sitemap.xml`, `${SITE_URL}/posts-sitemap.xml`],
  },
}
