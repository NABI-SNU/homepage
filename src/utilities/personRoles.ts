import type { Person } from '@/payload-types'

export type PersonRoleAssignment = NonNullable<NonNullable<Person['roleAssignments']>[number]>
export type PersonRoleValue = PersonRoleAssignment['role']

const roleLabelMap: Record<PersonRoleValue, string> = {
  executive: 'Executive',
  president: 'President',
}

export const formatPersonRoleLabel = (role: PersonRoleValue): string => roleLabelMap[role]

const rolePriorityMap: Record<PersonRoleValue, number> = {
  president: 0,
  executive: 1,
}

export const normalizePersonRoleAssignments = (value: unknown): PersonRoleAssignment[] | null => {
  if (!Array.isArray(value)) return null

  const normalized = new Map<number, PersonRoleAssignment>()

  for (const item of value) {
    if (!item || typeof item !== 'object') continue

    const candidate = item as {
      id?: string | null
      role?: unknown
      year?: unknown
    }

    const year = typeof candidate.year === 'number' ? candidate.year : Number(candidate.year)
    const role = candidate.role

    if (!Number.isInteger(year) || year < 1900 || year > 2100) continue
    if (role !== 'executive' && role !== 'president') continue

    normalized.set(year, {
      ...(candidate.id ? { id: candidate.id } : {}),
      role,
      year,
    })
  }

  const assignments = Array.from(normalized.values()).sort((a, b) => b.year - a.year)
  return assignments.length > 0 ? assignments : null
}

export const getPersonRoleForYear = (
  roleAssignments: Person['roleAssignments'] | null | undefined,
  year: number | null | undefined,
): PersonRoleAssignment | null => {
  if (!roleAssignments || !year) return null

  return roleAssignments.find((assignment) => assignment?.year === year) || null
}

export const getLatestPersonRoleAssignment = (
  roleAssignments: Person['roleAssignments'] | null | undefined,
): PersonRoleAssignment | null => {
  if (!roleAssignments || roleAssignments.length === 0) return null

  return (
    [...roleAssignments]
      .filter((assignment): assignment is PersonRoleAssignment =>
        Boolean(assignment && typeof assignment.year === 'number' && assignment.role),
      )
      .sort((a, b) => b.year - a.year)[0] || null
  )
}

export const comparePeopleByRoleForYear = <
  T extends {
    name?: string | null
    roleAssignments?: Person['roleAssignments'] | null
  },
>(
  left: T,
  right: T,
  year: number,
): number => {
  const leftRole = getPersonRoleForYear(left.roleAssignments, year)?.role
  const rightRole = getPersonRoleForYear(right.roleAssignments, year)?.role

  const leftPriority = leftRole ? rolePriorityMap[leftRole] : Number.POSITIVE_INFINITY
  const rightPriority = rightRole ? rolePriorityMap[rightRole] : Number.POSITIVE_INFINITY

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority
  }

  return (left.name || '').localeCompare(right.name || '', undefined, {
    sensitivity: 'base',
  })
}
