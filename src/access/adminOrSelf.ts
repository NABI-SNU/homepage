import type { Access } from 'payload'

import type { User } from '@/payload-types'
import { isAdminRequest } from './adminOnly'

export const adminOrSelf: Access<User> = async ({ req }) => {
  const user = req.user
  if (!user) return false
  if (await isAdminRequest(req)) return true

  return {
    id: {
      equals: user.id,
    },
  }
}
