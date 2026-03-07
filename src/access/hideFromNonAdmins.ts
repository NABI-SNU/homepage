import type { User } from '@/payload-types'
import { hasAdminRole } from './hasAdminRole'

type AdminVisibilityArgs = {
  user: unknown
}

export const hideFromNonAdmins = ({ user }: AdminVisibilityArgs): boolean => {
  if (!user) return false

  return !hasAdminRole(user as User | null | undefined)
}
