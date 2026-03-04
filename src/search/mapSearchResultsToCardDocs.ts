import type { CardDocData } from '@/components/Card'
import type { Media, Search } from '@/payload-types'
import { extractLegacyImageFromLexical } from '@/utilities/legacyImage'

export type PayloadLike = {
  find: (args: Record<string, unknown>) => Promise<{ docs: unknown[] }>
}

type NewsDocForSearch = {
  id: number
  image?: number | Media | null
  content?: unknown
}

type SearchResult = Pick<Search, 'doc' | 'meta' | 'slug' | 'title' | 'categories'>

const getSearchDocID = (result: SearchResult): number | null => {
  const docValue = result.doc?.value
  if (typeof docValue === 'number') return docValue

  if (
    docValue &&
    typeof docValue === 'object' &&
    'id' in docValue &&
    typeof docValue.id === 'number'
  ) {
    return docValue.id
  }

  return null
}

const resolveMedia = (image: unknown, mediaByID: Map<number, Media>): Media | null => {
  if (image && typeof image === 'object') return image as Media
  if (typeof image === 'number') return mediaByID.get(image) || null
  return null
}

export const mapSearchResultsToCardDocs = async ({
  payload,
  results,
}: {
  payload: PayloadLike
  results: SearchResult[]
}): Promise<CardDocData[]> => {
  const newsIDs = Array.from(
    new Set(
      results
        .map((result) => {
          if (result.doc?.relationTo !== 'news') return null
          return getSearchDocID(result)
        })
        .filter((id): id is number => typeof id === 'number'),
    ),
  )

  const newsDocByID = new Map<number, NewsDocForSearch>()

  if (newsIDs.length > 0) {
    const newsDocs = await payload.find({
      collection: 'news',
      depth: 0,
      limit: newsIDs.length,
      overrideAccess: false,
      pagination: false,
      where: {
        id: {
          in: newsIDs,
        },
      },
      select: {
        image: true,
        content: true,
      },
    })

    ;(newsDocs.docs as NewsDocForSearch[]).forEach((newsDoc) => {
      newsDocByID.set(newsDoc.id, newsDoc)
    })
  }

  const mediaIDs = Array.from(
    new Set(
      [
        ...results.map((result) => result.meta?.image),
        ...Array.from(newsDocByID.values()).map((newsDoc) => newsDoc.image),
      ].filter((image): image is number => typeof image === 'number'),
    ),
  )

  const mediaByID = new Map<number, Media>()

  if (mediaIDs.length > 0) {
    const media = await payload.find({
      collection: 'media',
      depth: 0,
      limit: mediaIDs.length,
      overrideAccess: false,
      pagination: false,
      where: {
        id: {
          in: mediaIDs,
        },
      },
    })

    ;(media.docs as Media[]).forEach((mediaDoc) => {
      mediaByID.set(mediaDoc.id, mediaDoc)
    })
  }

  return results.map((result) => {
    const relationTo = result.doc?.relationTo === 'news' ? 'news' : 'posts'
    const newsID = relationTo === 'news' ? getSearchDocID(result) : null
    const newsDoc = typeof newsID === 'number' ? newsDocByID.get(newsID) : null

    const resolvedMetaImage = resolveMedia(result.meta?.image, mediaByID)
    const fallbackImage = resolveMedia(newsDoc?.image, mediaByID)
    const finalImage = resolvedMetaImage || fallbackImage

    return {
      ...result,
      relationTo,
      previewImage:
        relationTo === 'news' && !finalImage
          ? extractLegacyImageFromLexical(newsDoc?.content)
          : null,
      meta: {
        ...(result.meta || {}),
        image: finalImage,
      },
    } as CardDocData
  })
}
