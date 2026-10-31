import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as mergeModule from '@/auth/mergeProfileOnlyUser'
import { syncBetterAuthUserToPayload } from '@/auth/syncBetterAuthUserToPayload'

vi.mock('@/auth/mergeProfileOnlyUser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/auth/mergeProfileOnlyUser')>()
  return {
    ...actual,
    mergeProfileOnlyUser: vi.fn(actual.mergeProfileOnlyUser),
  }
})

type FindArgs = {
  collection?: string
  where?: Record<string, unknown>
}

/** Top-level where key only (the contact-email lookup nests `id: not_equals` inside `and`). */
const whereHasTopLevel = (where: Record<string, unknown> | undefined, key: string): boolean =>
  Boolean(where && key in where)

const whereHasAnyLevel = (where: Record<string, unknown> | undefined, key: string): boolean => {
  if (!where) return false
  if (key in where) return true
  const and = where.and
  return (
    Array.isArray(and) &&
    and.some((clause) => clause && typeof clause === 'object' && key in clause)
  )
}

const account = {
  email: 'member@example.com',
  emailVerified: false,
  id: 25,
  isApproved: false,
  isVisible: false,
  memberType: 'user',
  name: 'member',
  role: 'user',
  roles: 'user',
  years: [2026],
}

/** A member an admin listed before the person ever signed up: contact email, no login. */
const listedMember = {
  bio: 'Listed bio',
  contactEmail: 'member@example.com',
  email: null,
  id: 90,
  isVisible: true,
  memberType: 'user',
  name: 'Member Example',
  research: ['Neuroscience'],
  roleAssignments: [{ role: 'president', year: 2026 }],
  slug: 'member-example',
  years: [2025, 2026],
}

const buildPayload = ({
  accountAfterMerge,
  withListedMember,
}: {
  accountAfterMerge?: Record<string, unknown>
  withListedMember: boolean
}) => {
  let merged = false

  const find = vi.fn(async (args: FindArgs) => {
    if (args.collection === 'users' && whereHasAnyLevel(args.where, 'contactEmail')) {
      return { docs: withListedMember ? [listedMember] : [] }
    }
    if (args.collection === 'users' && whereHasTopLevel(args.where, 'id')) {
      return { docs: [merged && accountAfterMerge ? accountAfterMerge : account] }
    }
    if (args.collection === 'posts') {
      return { docs: [{ authors: [90], id: 501 }] }
    }
    return { docs: [] }
  })

  const payload = {
    create: vi.fn(),
    // Authorship rows are re-pointed with SQL (see mergeProfileOnlyUser); the merge is "done"
    // from the sync's point of view once the profile-only record has been deleted.
    db: { drizzle: {}, execute: vi.fn(async () => ({})) },
    delete: vi.fn(async () => {
      merged = true
      return {}
    }),
    find,
    logger: { error: vi.fn(), info: vi.fn() },
    update: vi.fn(async () => ({})),
  }

  return payload
}

describe('auth sync auto-approval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('merges a listed profile-only member into a verified account and approves it', async () => {
    const payload = buildPayload({
      withListedMember: true,
      accountAfterMerge: {
        ...account,
        bio: listedMember.bio,
        isVisible: true,
        name: listedMember.name,
        slug: listedMember.slug,
      },
    })

    await syncBetterAuthUserToPayload({
      betterAuthUser: {
        email: 'member@example.com',
        emailVerified: true,
        id: '25',
        name: 'Member Example',
      },
      payload: payload as never,
    })

    expect(mergeModule.mergeProfileOnlyUser).toHaveBeenCalledTimes(1)
    expect(mergeModule.mergeProfileOnlyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.objectContaining({ id: 90 }),
        into: expect.objectContaining({ id: 25 }),
      }),
    )

    // Authorship (current documents and version history) moves to the account in SQL, before
    // anything is deleted.
    const sql = (payload.db.execute.mock.calls as unknown as Array<[{ raw: string }]>).map(
      ([a]) => a.raw,
    )
    expect(sql.some((q) => q.includes('UPDATE "posts_rels" SET users_id = 25'))).toBe(true)
    expect(sql.some((q) => q.includes('UPDATE "_posts_v_rels" SET users_id = 25'))).toBe(true)
    const lastSQLOrder = Math.max(...payload.db.execute.mock.invocationCallOrder)
    expect(lastSQLOrder).toBeLessThan(payload.delete.mock.invocationCallOrder[0])

    // The listed record gives up its slug, the profile lands on the account, and only then is
    // the listed record deleted — a failure in between loses nothing.
    const updates = payload.update.mock.calls as unknown as Array<
      [{ collection: string; data: Record<string, unknown>; id: number }]
    >
    const renameIndex = updates.findIndex(
      ([a]) =>
        a.id === 90 && a.data.slug === 'member-example-merged-90' && a.data.isVisible === false,
    )
    const profileIndex = updates.findIndex(
      ([a]) =>
        a.id === 25 &&
        a.data.slug === 'member-example' &&
        a.data.bio === 'Listed bio' &&
        a.data.isVisible === true &&
        a.data.name === 'Member Example' &&
        Array.isArray(a.data.research) &&
        Array.isArray(a.data.roleAssignments),
    )
    expect(renameIndex).toBeGreaterThanOrEqual(0)
    expect(profileIndex).toBeGreaterThan(renameIndex)
    expect(payload.update.mock.invocationCallOrder[profileIndex]).toBeLessThan(
      payload.delete.mock.invocationCallOrder[0],
    )
    expect(payload.delete).toHaveBeenCalledTimes(1)
    expect(payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'users', id: 90 }),
    )

    // Verified + listed → approved.
    expect(payload.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        collection: 'users',
        data: expect.objectContaining({ isApproved: true }),
        id: 25,
      }),
    )
  })

  it('does not merge or approve while the email is unverified', async () => {
    const payload = buildPayload({ withListedMember: true })

    await syncBetterAuthUserToPayload({
      betterAuthUser: {
        email: 'member@example.com',
        emailVerified: false,
        id: '25',
        name: 'Member Example',
      },
      payload: payload as never,
    })

    expect(mergeModule.mergeProfileOnlyUser).not.toHaveBeenCalled()
    expect(payload.delete).not.toHaveBeenCalled()

    const contactLookups = (payload.find.mock.calls as Array<[FindArgs]>).filter(([args]) =>
      whereHasAnyLevel(args.where, 'contactEmail'),
    )
    expect(contactLookups).toHaveLength(0)

    const approvals = (
      payload.update.mock.calls as unknown as Array<[{ data?: Record<string, unknown> }]>
    ).filter(([args]) => args.data?.isApproved === true)
    expect(approvals).toHaveLength(0)
  })

  it('does not approve a verified account that nobody listed', async () => {
    const payload = buildPayload({ withListedMember: false })

    await syncBetterAuthUserToPayload({
      betterAuthUser: {
        email: 'member@example.com',
        emailVerified: true,
        id: '25',
        name: 'Member Example',
      },
      payload: payload as never,
    })

    expect(mergeModule.mergeProfileOnlyUser).not.toHaveBeenCalled()
    expect(payload.delete).not.toHaveBeenCalled()

    const approvals = (
      payload.update.mock.calls as unknown as Array<[{ data?: Record<string, unknown> }]>
    ).filter(([args]) => args.data?.isApproved === true)
    expect(approvals).toHaveLength(0)
  })

  it('approves a verified account that an admin already made visible', async () => {
    const payload = buildPayload({ withListedMember: false })
    payload.find.mockImplementation(async (args: FindArgs) => {
      if (args.collection === 'users' && whereHasTopLevel(args.where, 'id')) {
        return { docs: [{ ...account, isVisible: true }] }
      }
      return { docs: [] }
    })

    await syncBetterAuthUserToPayload({
      betterAuthUser: {
        email: 'member@example.com',
        emailVerified: true,
        id: '25',
        name: 'Member Example',
      },
      payload: payload as never,
    })

    expect(mergeModule.mergeProfileOnlyUser).not.toHaveBeenCalled()
    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        data: expect.objectContaining({ isApproved: true }),
        id: 25,
      }),
    )
  })
})
