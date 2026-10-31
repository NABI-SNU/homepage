import type { Access } from 'payload'

import type { Post, User } from '@/payload-types'

/** Any signed-in member: every user is their own author profile now. */
export const adminOrLinkedPerson: Access<Post | User> = ({ req }) => {
  const user = req.user as User | null | undefined
  return Boolean(user?.id)
}
