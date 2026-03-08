import type { Access, PayloadRequest } from 'payload'

import { isAdminRequest } from './adminOnly'
import { getAccessCache } from './requestAccessCache'

const getPublishedNotebookIDs = async (req: PayloadRequest): Promise<number[]> => {
  const cache = getAccessCache(req)

  if (cache.publishedNotebookIDs) {
    return cache.publishedNotebookIDs
  }

  const result = await req.payload.find({
    collection: 'research',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    select: {
      notebook: true,
    },
    where: {
      and: [
        {
          _status: {
            equals: 'published',
          },
        },
        {
          notebook: {
            exists: true,
          },
        },
      ],
    },
  })

  const publishedNotebookIDs = Array.from(
    new Set(
      result.docs
        .map(({ notebook }) => {
          if (typeof notebook === 'number') return notebook
          if (notebook && typeof notebook === 'object' && 'id' in notebook) {
            return typeof notebook.id === 'number' ? notebook.id : null
          }
          return null
        })
        .filter((value): value is number => value !== null),
    ),
  )

  cache.publishedNotebookIDs = publishedNotebookIDs

  return publishedNotebookIDs
}

const getNotebookIDForFilename = async (
  req: PayloadRequest,
  filename: string,
): Promise<number | null> => {
  const result = await req.payload.find({
    collection: 'notebooks',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      filename: {
        equals: filename,
      },
    },
  })

  const [doc] = result.docs
  return typeof doc?.id === 'number' ? doc.id : null
}

export const publishedResearchNotebook: Access = async ({ data, id, req }) => {
  if (await isAdminRequest(req)) {
    return true
  }

  const publishedNotebookIDs = await getPublishedNotebookIDs(req)

  if (typeof id === 'number') {
    return publishedNotebookIDs.includes(id)
  }

  if (typeof id === 'string' && /^\d+$/.test(id)) {
    return publishedNotebookIDs.includes(Number(id))
  }

  if (data && typeof data === 'object' && 'filename' in data) {
    const filename = data.filename

    if (typeof filename !== 'string' || !filename.trim()) {
      return false
    }

    const notebookID = await getNotebookIDForFilename(req, filename)
    return notebookID ? publishedNotebookIDs.includes(notebookID) : false
  }

  if (publishedNotebookIDs.length === 0) {
    return false
  }

  return {
    id: {
      in: publishedNotebookIDs,
    },
  }
}
