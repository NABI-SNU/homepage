import type { Access } from 'payload'

import { hasAdminRole } from '@/access/hasAdminRole'
import type { Wiki, User } from '@/payload-types'

export const adminOrWikiOwner: Access<Wiki> = ({ req: { user } }) => {
  const typedUser = user as User | null | undefined
  if (!typedUser?.id) return false
  if (hasAdminRole(typedUser)) return true

  return {
    createdBy: {
      equals: typedUser.id,
    },
  }
}

