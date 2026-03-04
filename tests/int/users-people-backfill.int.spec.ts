import type { Payload } from 'payload'
import { describe, expect, it } from 'vitest'

import { backfillUsersToPeople } from '@/auth/backfillUsersToPeople'

type MockUser = {
  email?: string | null
  id: number
  name?: string | null
}

type MockPerson = {
  email?: string | null
  id: number
  memberType?: 'alumni' | 'user'
  name: string
  slug: string
  user?: number | null
}

const normalizeEmail = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const buildMockPayload = ({
  people,
  users,
}: {
  people: MockPerson[]
  users: MockUser[]
}): Payload => {
  const mutablePeople = [...people]

  const payload = {
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      if (collection !== 'people') {
        throw new Error(`Unsupported create collection: ${collection}`)
      }

      const nextID = Math.max(0, ...mutablePeople.map((person) => person.id)) + 1
      const created: MockPerson = {
        id: nextID,
        name: String(data.name || ''),
        slug: String(data.slug || ''),
        email: typeof data.email === 'string' ? data.email : null,
        memberType: data.memberType === 'alumni' ? 'alumni' : 'user',
        user: typeof data.user === 'number' ? data.user : null,
      }
      mutablePeople.push(created)
      return created
    },
    find: async ({
      collection,
      limit,
      page,
      where,
    }: {
      collection: string
      limit?: number
      page?: number
      where?: Record<string, unknown>
    }) => {
      if (collection === 'users') {
        const safeLimit = limit ?? 100
        const safePage = page ?? 1
        const start = (safePage - 1) * safeLimit
        const docs = users.slice(start, start + safeLimit)
        const hasNextPage = start + safeLimit < users.length
        return { docs, hasNextPage }
      }

      if (collection === 'people') {
        const userFilter = (where?.user as { equals?: number } | undefined)?.equals
        if (typeof userFilter === 'number') {
          const docs = mutablePeople.filter((person) => person.user === userFilter).slice(0, limit ?? 25)
          return { docs, hasNextPage: false }
        }

        const emailFilter = normalizeEmail(
          (where?.email as { equals?: string | null } | undefined)?.equals ?? null,
        )
        if (emailFilter) {
          const docs = mutablePeople
            .filter((person) => normalizeEmail(person.email) === emailFilter)
            .slice(0, limit ?? 25)
          return { docs, hasNextPage: false }
        }

        return { docs: mutablePeople.slice(0, limit ?? 25), hasNextPage: false }
      }

      throw new Error(`Unsupported find collection: ${collection}`)
    },
    logger: {
      error: () => null,
      info: () => null,
      warn: () => null,
    },
    update: async ({
      collection,
      data,
      id,
    }: {
      collection: string
      data: Record<string, unknown>
      id: number
    }) => {
      if (collection !== 'people') {
        throw new Error(`Unsupported update collection: ${collection}`)
      }

      const index = mutablePeople.findIndex((person) => person.id === id)
      if (index < 0) throw new Error(`Person not found: ${id}`)

      const existing = mutablePeople[index]
      mutablePeople[index] = {
        ...existing,
        ...data,
        id: existing.id,
      } as MockPerson

      return mutablePeople[index]
    },
  }

  return payload as unknown as Payload
}

describe('users to people backfill', () => {
  it('creates a person when a user has no linked person', async () => {
    const payload = buildMockPayload({
      users: [{ id: 7, email: 'new-user@example.com', name: 'New User' }],
      people: [],
    })

    await backfillUsersToPeople(payload)

    const people = await payload.find({ collection: 'people', limit: 10 })
    expect(people.docs).toHaveLength(1)
    expect(people.docs[0]).toMatchObject({
      user: 7,
      memberType: 'user',
      email: 'new-user@example.com',
    })
  })

  it('links an existing unlinked person by email instead of creating duplicate', async () => {
    const payload = buildMockPayload({
      users: [{ id: 10, email: 'link-me@example.com', name: 'Link Me' }],
      people: [
        {
          id: 33,
          email: 'link-me@example.com',
          memberType: 'alumni',
          name: 'Legacy Person',
          slug: 'legacy-person',
          user: null,
        },
      ],
    })

    await backfillUsersToPeople(payload)

    const people = await payload.find({ collection: 'people', limit: 10 })
    expect(people.docs).toHaveLength(1)
    expect(people.docs[0]).toMatchObject({
      id: 33,
      user: 10,
      memberType: 'user',
    })
  })

  it('is idempotent across repeated runs', async () => {
    const payload = buildMockPayload({
      users: [{ id: 11, email: 'repeat@example.com', name: 'Repeat User' }],
      people: [],
    })

    await backfillUsersToPeople(payload)
    await backfillUsersToPeople(payload)

    const people = await payload.find({ collection: 'people', limit: 10 })
    expect(people.docs).toHaveLength(1)
    expect(people.docs[0]).toMatchObject({
      user: 11,
      memberType: 'user',
    })
  })
})
