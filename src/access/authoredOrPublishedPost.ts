import type { Access, Where } from 'payload'

import type { Post, User } from '@/payload-types'
import { getLinkedPersonIDs } from './getLinkedPersonIDs'
import { isAdminRequest } from './adminOnly'

export const authoredOrPublishedPost: Access<Post> = async ({ req }) => {
  const publishedWhere: Where = {
    _status: {
      equals: 'published',
    },
  }

  const user = req.user as User | null | undefined

  if (!user?.id) {
    return publishedWhere
  }

  if (await isAdminRequest(req)) return true

  const linkedPersonIDs = await getLinkedPersonIDs(req)
  if (linkedPersonIDs.length === 0) {
    return publishedWhere
  }

  return {
    or: [
      publishedWhere,
      ...linkedPersonIDs.map((personID) => ({
        authors: {
          contains: personID,
        },
      })),
    ],
  }
}
