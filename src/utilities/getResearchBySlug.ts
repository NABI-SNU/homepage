import type { Payload } from 'payload'

import type { User } from '@/payload-types'

type FindResearchBySlugArgs = {
  depth?: number
  draft: boolean
  payload: Payload
  slug: string
  user?: User | null
}

export const findResearchBySlug = async ({
  depth = 2,
  draft,
  payload,
  slug,
  user,
}: FindResearchBySlugArgs) => {
  const result = await payload.find({
    collection: 'research',
    depth,
    draft,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    ...(user ? { user } : {}),
    where: draft
      ? {
          slug: {
            equals: slug,
          },
        }
      : {
          and: [
            {
              slug: {
                equals: slug,
              },
            },
            {
              _status: {
                equals: 'published',
              },
            },
          ],
        },
  })

  return result.docs[0] || null
}
