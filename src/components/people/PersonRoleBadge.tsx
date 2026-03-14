import { cn } from '@/utilities/ui'

import type { Person } from '@/payload-types'

import { formatPersonRoleLabel } from '@/utilities/personRoles'

type Props = {
  className?: string
  role?: PersonRole | null
  year?: number | null
}

type PersonRole = NonNullable<NonNullable<Person['roleAssignments']>[number]>['role']

export function PersonRoleBadge({ className, role, year }: Props) {
  if (!role) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary',
        className,
      )}
    >
      {formatPersonRoleLabel(role)}
      {year ? <span className="ml-1 text-primary/80">{year}</span> : null}
    </span>
  )
}
