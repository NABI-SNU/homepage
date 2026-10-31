import type { Access, FieldAccess, Where } from 'payload'

import type { User } from '@/payload-types'
import { hasAdminRole } from './hasAdminRole'

/**
 * Users double as the public member directory, so reading is open — but only for members that
 * are marked visible. Admins see everyone; a signed-in user always sees their own record.
 * Sensitive columns are hidden per field with `adminOrSelfField`.
 */
export const publicReadableUsers: Access = ({ req }) => {
  const user = req.user as User | null | undefined

  if (user && hasAdminRole(user)) return true

  const visible: Where = { isVisible: { equals: true } }

  if (user?.id) {
    return {
      or: [visible, { id: { equals: user.id } }],
    }
  }

  return visible
}

/** Field-level: the account owner and admins only (approval state, roles, auth bookkeeping). */
export const adminOrSelfField: FieldAccess = ({ doc, req }) => {
  const user = req.user as User | null | undefined
  if (!user?.id) return false
  if (hasAdminRole(user)) return true
  return doc?.id === user.id
}
