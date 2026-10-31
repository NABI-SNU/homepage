import type { CollectionBeforeValidateHook } from 'payload'

import type { User } from '@/payload-types'
import { normalizePersonRoleAssignments } from '@/utilities/personRoles'
import { parseResearchTags } from '@/utilities/researchTags'

/**
 * Normalises the public-profile fields that used to live on People: research topics become a
 * clean list, role assignments are de-duplicated per year, and participation years are the
 * union of the explicit years and the role-assignment years (newest first).
 */
export const normalizeProfileFields: CollectionBeforeValidateHook<User> = ({ data }) => {
  if (!data || typeof data !== 'object') return data

  const touchesProfile =
    'research' in data || 'years' in data || 'roleAssignments' in data || 'name' in data
  if (!touchesProfile) return data

  const next: Record<string, unknown> = { ...data }

  if ('research' in data) {
    next.research = parseResearchTags((data as { research?: string | string[] | null }).research)
  }

  if ('roleAssignments' in data || 'years' in data) {
    const rawYears = (data as { years?: number[] | number | null }).years
    const yearValues = Array.isArray(rawYears) ? rawYears : rawYears != null ? [rawYears] : []
    const normalizedRoleAssignments = normalizePersonRoleAssignments(
      (data as { roleAssignments?: unknown }).roleAssignments,
    )
    const roleYears = (normalizedRoleAssignments || []).map((assignment) => assignment.year)
    const normalizedYears = Array.from(
      new Set(
        [...yearValues, ...roleYears]
          .map((value): number => (typeof value === 'number' ? value : Number(value)))
          .filter(
            (value): value is number => Number.isInteger(value) && value >= 1900 && value <= 2100,
          ),
      ),
    ).sort((a: number, b: number) => b - a)

    if ('roleAssignments' in data) next.roleAssignments = normalizedRoleAssignments || []
    if ('years' in data || roleYears.length > 0) {
      next.years = normalizedYears.length > 0 ? normalizedYears : undefined
    }
  }

  if (typeof next.name === 'string') {
    next.name = next.name.trim().replace(/\s+/g, ' ')
  }

  return next as typeof data
}
