import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { requireTestAccountUsers } from '../helpers/testAccounts'

let payload: Payload
let users: Awaited<ReturnType<typeof requireTestAccountUsers>>

const runID = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`

/**
 * Users double as the public member directory. Reading is open for visible members (admins see
 * everyone, a user always sees itself) with sensitive columns restricted per field; writing
 * through the collection API is admin-only — members edit themselves via /account/profile.
 */
describe('Users profile access', () => {
  let visibleMemberID: number | null = null
  let hiddenMemberID: number | null = null

  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    users = await requireTestAccountUsers(payload)

    // Throwaway profile-only members (no login email, contact address only).
    const visibleMember = await payload.create({
      collection: 'users',
      overrideAccess: true,
      context: { disableRevalidate: true },
      data: {
        name: `Profile Access Visible ${runID}`,
        slug: `profile-access-visible-${runID}`,
        contactEmail: `profile-access-visible-${runID}@example.com`,
        bio: 'Original visible bio',
        years: [2026],
        memberType: 'alumni',
        isVisible: true,
        isApproved: false,
        emailVerified: false,
      } as never,
    })
    visibleMemberID = visibleMember.id

    const hiddenMember = await payload.create({
      collection: 'users',
      overrideAccess: true,
      context: { disableRevalidate: true },
      data: {
        name: `Profile Access Hidden ${runID}`,
        slug: `profile-access-hidden-${runID}`,
        contactEmail: `profile-access-hidden-${runID}@example.com`,
        bio: 'Original hidden bio',
        years: [2026],
        memberType: 'user',
        isVisible: false,
        isApproved: false,
        emailVerified: false,
      } as never,
    })
    hiddenMemberID = hiddenMember.id
  }, 60_000)

  afterAll(async () => {
    for (const id of [visibleMemberID, hiddenMemberID]) {
      if (!id) continue
      await payload.delete({
        collection: 'users',
        id,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
    }
  }, 30_000)

  it('blocks a plain user from updating another user through the collection API', async () => {
    await expect(
      payload.update({
        collection: 'users',
        id: visibleMemberID as number,
        data: { bio: `Unauthorized update ${runID}` },
        user: users.user,
        overrideAccess: false,
        context: { disableRevalidate: true },
      }),
    ).rejects.toThrow()

    const untouched = await payload.findByID({
      collection: 'users',
      id: visibleMemberID as number,
      depth: 0,
      overrideAccess: true,
    })
    expect(untouched.bio).toBe('Original visible bio')
  }, 30_000)

  it('blocks a plain user from updating even their own record through the collection API', async () => {
    // Self-service edits go through /account/profile, which whitelists fields and bypasses
    // access on purpose; the collection itself stays admin-only.
    await expect(
      payload.update({
        collection: 'users',
        id: users.user.id,
        data: { bio: `Self update ${runID}` },
        user: users.user,
        overrideAccess: false,
        context: { disableRevalidate: true },
      }),
    ).rejects.toThrow()
  }, 30_000)

  it('lets an admin update any user', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: visibleMemberID as number,
      data: { bio: `Admin updated bio ${runID}` },
      user: users.admin,
      overrideAccess: false,
      context: { disableRevalidate: true },
    })

    expect(updated.bio).toBe(`Admin updated bio ${runID}`)
  }, 30_000)

  it('lets a plain user read a visible member but not a hidden one', async () => {
    const visible = await payload.findByID({
      collection: 'users',
      id: visibleMemberID as number,
      depth: 0,
      user: users.user,
      overrideAccess: false,
    })
    expect(visible.id).toBe(visibleMemberID)
    expect(visible.name).toBe(`Profile Access Visible ${runID}`)

    await expect(
      payload.findByID({
        collection: 'users',
        id: hiddenMemberID as number,
        depth: 0,
        user: users.user,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const listed = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 10,
      pagination: false,
      user: users.user,
      overrideAccess: false,
      where: {
        id: { in: [visibleMemberID as number, hiddenMemberID as number] },
      },
    })
    expect(listed.docs.map((doc) => doc.id)).toEqual([visibleMemberID])
  }, 30_000)

  it('lets an admin read hidden members', async () => {
    const hidden = await payload.findByID({
      collection: 'users',
      id: hiddenMemberID as number,
      depth: 0,
      user: users.admin,
      overrideAccess: false,
    })

    expect(hidden.id).toBe(hiddenMemberID)
    expect(hidden.isVisible).toBe(false)
  }, 30_000)

  it('hides approval and auth bookkeeping fields from other plain users', async () => {
    const asOtherUser = (await payload.findByID({
      collection: 'users',
      id: visibleMemberID as number,
      depth: 0,
      user: users.user,
      overrideAccess: false,
    })) as unknown as Record<string, unknown>

    expect(asOtherUser.isApproved).toBeUndefined()
    expect(asOtherUser.emailVerified).toBeUndefined()
    expect(asOtherUser.betterAuthUserId).toBeUndefined()
    expect(asOtherUser.role).toBeUndefined()
    expect(asOtherUser.roles).toBeUndefined()
    // Public profile fields stay readable.
    expect(asOtherUser.name).toBe(`Profile Access Visible ${runID}`)
    expect(asOtherUser.slug).toBe(`profile-access-visible-${runID}`)

    const asSelf = await payload.findByID({
      collection: 'users',
      id: users.user.id,
      depth: 0,
      user: users.user,
      overrideAccess: false,
    })
    expect(typeof asSelf.isApproved).toBe('boolean')
    expect(asSelf.roles).toBeDefined()

    const asAdmin = await payload.findByID({
      collection: 'users',
      id: visibleMemberID as number,
      depth: 0,
      user: users.admin,
      overrideAccess: false,
    })
    expect(typeof asAdmin.isApproved).toBe('boolean')
  }, 30_000)
})
