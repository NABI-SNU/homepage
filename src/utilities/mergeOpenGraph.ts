import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Official website of NABI Labs at Seoul National University exploring neuroscience and AI.',
  images: [
    {
      url: `${getServerSideURL()}/preview.webp`,
    },
  ],
  siteName: 'NABI Labs',
  title: 'NABI Labs',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
