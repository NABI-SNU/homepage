import type { User } from '@/payload-types'

export const hasAdminRole = (user: User | null | undefined): boolean => {
  const normalizedRoles = [user?.role, user?.roles]
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .filter((value): value is string => typeof value === 'string')

  return normalizedRoles.includes('admin')
}
