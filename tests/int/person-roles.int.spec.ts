import { describe, expect, it } from 'vitest'

import {
  comparePeopleByRoleForYear,
  getLatestPersonRoleAssignment,
  getPersonRoleForYear,
  normalizePersonRoleAssignments,
  type PersonRoleAssignment,
} from '@/utilities/personRoles'

describe('person roles', () => {
  it('normalizes role assignments by year and keeps the latest value for duplicates', () => {
    const normalized = normalizePersonRoleAssignments([
      { role: 'executive', year: 2025 },
      { role: 'president', year: 2026 },
      { role: 'executive', year: 2025 },
      { role: 'invalid', year: 2024 },
    ])

    expect(normalized).toEqual([
      { role: 'president', year: 2026 },
      { role: 'executive', year: 2025 },
    ])
  })

  it('finds the role assignment for a specific year', () => {
    const assignments: PersonRoleAssignment[] = [
      { role: 'president', year: 2026 },
      { role: 'executive', year: 2025 },
    ]

    expect(getPersonRoleForYear(assignments, 2025)).toEqual({
      role: 'executive',
      year: 2025,
    })
    expect(getPersonRoleForYear(assignments, 2024)).toBeNull()
  })

  it('returns the latest available role assignment', () => {
    const assignments: PersonRoleAssignment[] = [
      { role: 'executive', year: 2024 },
      { role: 'president', year: 2026 },
      { role: 'executive', year: 2025 },
    ]

    expect(getLatestPersonRoleAssignment(assignments)).toEqual({
      role: 'president',
      year: 2026,
    })
  })

  it('sorts presidents first, then executives, then everyone else', () => {
    const sorted = [
      {
        name: 'Taylor Member',
        roleAssignments: null,
      },
      {
        name: 'Alex Executive',
        roleAssignments: [{ role: 'executive', year: 2026 }] satisfies PersonRoleAssignment[],
      },
      {
        name: 'Pat President',
        roleAssignments: [{ role: 'president', year: 2026 }] satisfies PersonRoleAssignment[],
      },
      {
        name: 'Jamie Executive',
        roleAssignments: [{ role: 'executive', year: 2026 }] satisfies PersonRoleAssignment[],
      },
    ].sort((left, right) => comparePeopleByRoleForYear(left, right, 2026))

    expect(sorted.map((person) => person.name)).toEqual([
      'Pat President',
      'Alex Executive',
      'Jamie Executive',
      'Taylor Member',
    ])
  })
})
