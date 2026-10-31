import type { CollectionAfterChangeHook, Payload, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

/**
 * Deletes every Better Auth session of a user, signing them out everywhere.
 *
 * The per-request policy check already denies a revoked account on its next request; removing
 * the sessions as well keeps the `sessions` table honest and makes the revocation visible
 * (the admin sees zero sessions for the user).
 */
export const revokeUserSessions = async ({
  payload,
  req,
  userID,
}: {
  payload: Payload
  req?: PayloadRequest
  userID: number
}): Promise<void> => {
  try {
    await payload.delete({
      collection: 'sessions',
      depth: 0,
      overrideAccess: true,
      req,
      where: {
        user: {
          equals: userID,
        },
      },
    })
  } catch (error) {
    payload.logger.error(
      `[auth] Failed revoking sessions for user ${userID}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Losing approval, being hidden from the directory or being marked alumni all end the right to
 * sign in, so they sign the user out everywhere.
 */
export const revokeSessionsOnAccessLoss: CollectionAfterChangeHook<User> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== 'update' || !previousDoc) return doc

  // `doc` may be a partial document when the update used `select`; a missing field means
  // "unchanged", never "revoked".
  const lostApproval = previousDoc.isApproved === true && doc.isApproved === false
  const becameHidden = previousDoc.isVisible !== false && doc.isVisible === false
  const becameAlumni = previousDoc.memberType !== 'alumni' && doc.memberType === 'alumni'

  if (!lostApproval && !becameHidden && !becameAlumni) return doc

  await revokeUserSessions({ payload: req.payload, req, userID: doc.id })
  return doc
}
