import type { PayloadRequest } from 'payload'

/**
 * Author identity for the requesting user.
 *
 * Profiles used to live in a separate `people` collection linked to the user, so this needed a
 * lookup (and a cache). The profile *is* the user now: a post is "mine" when `authors` contains
 * my own user id. Kept as a function so the call sites read the same.
 */
export const getLinkedPersonIDs = async (req: PayloadRequest): Promise<number[]> => {
  const userID = req.user?.id
  return typeof userID === 'number' ? [userID] : []
}
