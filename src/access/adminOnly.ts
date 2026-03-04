import type { Access, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'
import { hasAdminRole } from './hasAdminRole'

export const isAdminRequest = async (req: PayloadRequest): Promise<boolean> => {
  return hasAdminRole(req.user as User | null | undefined)
}

export const adminOnly: Access<User> = async ({ req }) => {
  return isAdminRequest(req)
}
