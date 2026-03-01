import type { Access, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'
import { hasAdminRole } from './hasAdminRole'

export const isAdminRequest = async (req: PayloadRequest): Promise<boolean> => {
  if (hasAdminRole(req.user as User | null | undefined)) return true

  const userID = req.user?.id
  if (!userID) return false

  try {
    const hydratedUser = await req.payload.findByID({
      collection: 'users',
      id: userID,
      depth: 0,
      overrideAccess: true,
    })

    return hasAdminRole(hydratedUser as User)
  } catch {
    return false
  }
}

export const adminOnly: Access<User> = async ({ req }) => {
  return isAdminRequest(req)
}
