const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // The year filter used to be a query string, which made /news render on every request.
  const newsYearRedirect = {
    destination: '/news/year/:year',
    has: [{ type: 'query', key: 'year', value: '(?<year>\\d{4})' }],
    permanent: false,
    source: '/news',
  }

  const conferencesYearRedirect = {
    destination: '/conferences/year/:year',
    has: [{ type: 'query', key: 'year', value: '(?<year>\\d{4})' }],
    permanent: false,
    source: '/conferences',
  }

  // Post search moved to its own route so /posts and its pages can be prerendered.
  const postsSearchRedirects = ['/posts', '/posts/page/:pageNumber'].map((source) => ({
    destination: '/posts/search?q=:q',
    has: [{ type: 'query', key: 'q', value: '(?<q>.+)' }],
    permanent: false,
    source,
  }))

  const redirects = [
    internetExplorerRedirect,
    newsYearRedirect,
    conferencesYearRedirect,
    ...postsSearchRedirects,
  ]

  return redirects
}

export default redirects
