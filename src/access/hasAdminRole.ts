import type { User } from '@/payload-types'

export const hasAdminRole = (user: User | null | undefined): boolean => {
  const roles = user?.roles

  if (Array.isArray(roles)) return roles.includes('admin')
  return roles === 'admin'
}
