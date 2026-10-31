import type { CollectionAfterChangeHook, Payload, PayloadRequest } from 'payload'

import type { Person, User } from '@/payload-types'

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

/** Users: losing approval signs the user out everywhere. */
export const revokeSessionsOnDisapproval: CollectionAfterChangeHook<User> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== 'update') return doc
  if (previousDoc?.isApproved !== true || doc.isApproved === true) return doc

  await revokeUserSessions({ payload: req.payload, req, userID: doc.id })
  return doc
}

const linkedUserID = (person: Partial<Person> | null | undefined): number | null => {
  const user = person?.user
  if (typeof user === 'number') return user
  if (user && typeof user === 'object' && typeof user.id === 'number') return user.id
  return null
}

/** People: hiding a Person or marking them alumni signs the linked user out everywhere. */
export const revokeSessionsOnPersonAccessLoss: CollectionAfterChangeHook<Person> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== 'update') return doc

  const userID = linkedUserID(doc) ?? linkedUserID(previousDoc)
  if (!userID) return doc

  const becameHidden = previousDoc?.isVisible !== false && doc.isVisible === false
  const becameAlumni = previousDoc?.memberType !== 'alumni' && doc.memberType === 'alumni'

  if (!becameHidden && !becameAlumni) return doc

  await revokeUserSessions({ payload: req.payload, req, userID })
  return doc
}
