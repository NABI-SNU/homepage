import type { CollectionBeforeChangeHook } from 'payload'

import { hasAdminRole } from '@/access/hasAdminRole'
import type { User } from '@/payload-types'

const normalizeOwnerID = (value: unknown): number | null => {
  if (typeof value === 'number') return value

  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : null
  }

  return null
}

export const assignWikiOwner: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const user = req.user as User | null | undefined
  if (!user?.id) return data

  const userID = typeof user.id === 'number' ? user.id : Number(user.id)
  if (!Number.isFinite(userID)) return data

  const isAdmin = hasAdminRole(user)

  if (operation === 'create') {
    const incomingOwner = normalizeOwnerID((data as { createdBy?: unknown })?.createdBy)
    if (!incomingOwner) {
      ;(data as { createdBy?: number }).createdBy = userID
    }

    return data
  }

  if (!isAdmin) {
    const existingOwner = normalizeOwnerID((originalDoc as { createdBy?: unknown })?.createdBy)
    ;(data as { createdBy?: number }).createdBy = existingOwner ?? userID
  }

  return data
}
