import type { Access } from 'payload'

import type { Post, User } from '@/payload-types'
import { getLinkedPersonIDs } from './getLinkedPersonIDs'
import { isAdminRequest } from './adminOnly'

export const adminOrLinkedPerson: Access<Post | User> = async ({ req }) => {
  const user = req.user as User | null | undefined
  if (!user?.id) return false

  if (await isAdminRequest(req)) return true

  const linkedPersonIDs = await getLinkedPersonIDs(req)
  return linkedPersonIDs.length > 0
}
