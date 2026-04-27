import type { CollectionBeforeValidateHook } from 'payload'

type UserRole = 'admin' | 'user'

const normalizeRole = (value: unknown): UserRole => {
  if (Array.isArray(value)) {
    return value.includes('admin') ? 'admin' : 'user'
  }

  return value === 'admin' ? 'admin' : 'user'
}

export const syncUserRoleFields: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data || typeof data !== 'object') return data

  const nextData = { ...data } as Record<string, unknown>
  const resolvedRole = normalizeRole(
    nextData.role ?? nextData.roles ?? originalDoc?.role ?? originalDoc?.roles,
  )

  nextData.role = resolvedRole
  nextData.roles = resolvedRole

  return nextData
}
