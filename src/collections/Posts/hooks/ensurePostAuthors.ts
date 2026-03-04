import type { CollectionBeforeValidateHook } from 'payload'

import type { Post } from '@/payload-types'
import { getLinkedPersonIDs } from '@/access/getLinkedPersonIDs'
import { isAdminRequest } from '@/access/adminOnly'

export const ensurePostAuthors: CollectionBeforeValidateHook<Post> = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data
  if (await isAdminRequest(req)) return data

  const linkedPersonIDs = await getLinkedPersonIDs(req)
  if (linkedPersonIDs.length === 0) return data

  if (!data || typeof data !== 'object') {
    return data
  }

  // Force non-admin-created posts to include the requester's linked people profile.
  return {
    ...data,
    authors: linkedPersonIDs,
  }
}
