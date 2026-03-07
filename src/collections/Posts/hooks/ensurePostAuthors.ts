import type { CollectionBeforeValidateHook } from 'payload'

import type { Post } from '@/payload-types'
import { getLinkedPersonIDs } from '@/access/getLinkedPersonIDs'
import { isAdminRequest } from '@/access/adminOnly'

const normalizeRelationshipID = (
  value: number | { id?: number | null } | null | undefined,
): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && typeof value.id === 'number') return value.id
  return null
}

const mergeAuthorIDs = ({
  fallbackAuthors,
  incomingAuthors,
  linkedPersonIDs,
}: {
  fallbackAuthors?: Post['authors'] | null
  incomingAuthors?: Post['authors'] | null
  linkedPersonIDs: number[]
}): number[] => {
  const currentAuthorIDs = (incomingAuthors ?? fallbackAuthors ?? [])
    .map((author) => normalizeRelationshipID(author as number | { id?: number | null } | null))
    .filter((authorID): authorID is number => authorID !== null)

  return Array.from(new Set([...currentAuthorIDs, ...linkedPersonIDs]))
}

export const ensurePostAuthors: CollectionBeforeValidateHook<Post> = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (operation !== 'create' && operation !== 'update') return data
  if (await isAdminRequest(req)) return data

  const linkedPersonIDs = await getLinkedPersonIDs(req)
  if (linkedPersonIDs.length === 0) return data

  if (!data || typeof data !== 'object') {
    return data
  }

  // Force non-admin-created posts to include the requester's linked people profile.
  return {
    ...data,
    authors: mergeAuthorIDs({
      fallbackAuthors: originalDoc?.authors,
      incomingAuthors: data.authors,
      linkedPersonIDs,
    }),
  }
}
