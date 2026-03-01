import type { Access } from 'payload'

import type { Post, User } from '@/payload-types'
import { isAdminRequest } from './adminOnly'

export const adminOrAuthoredPost: Access<Post> = async ({ req }) => {
  const user = req.user as User | null | undefined
  if (!user?.id) return false

  if (await isAdminRequest(req)) return true

  const linkedPeople = await req.payload.find({
    collection: 'people',
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  if (linkedPeople.docs.length === 0) return false

  return {
    or: linkedPeople.docs.map((person) => ({
      authors: {
        contains: person.id,
      },
    })),
  }
}
