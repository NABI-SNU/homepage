import type { Payload } from 'payload'

import type { User } from '@/payload-types'

export const userTestAccount = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'test',
} as const

export const adminTestAccount = {
  email: 'dev@payloadcms.com',
  name: 'Payload Admin',
  password: 'test',
} as const

type TestAccountUsers = {
  admin: User
  user: User
}

const getSingleUserByEmail = async ({
  email,
  label,
  payload,
}: {
  email: string
  label: string
  payload: Payload
}): Promise<User> => {
  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: email,
      },
    },
  })

  if (users.docs.length === 0) {
    throw new Error(
      `Missing ${label} account "${email}". Tests require pre-seeded users and must not create users.`,
    )
  }

  if (users.docs.length > 1) {
    throw new Error(`Duplicate users found for "${email}". Ensure only one account exists for this test.`)
  }

  return users.docs[0] as User
}

const hasAdminRole = (user: User): boolean => {
  const roles = user.roles
  if (Array.isArray(roles)) return roles.includes('admin')
  return roles === 'admin'
}

export async function requireTestAccountUsers(payload: Payload): Promise<TestAccountUsers> {
  const [user, admin] = await Promise.all([
    getSingleUserByEmail({
      payload,
      email: userTestAccount.email,
      label: 'user test',
    }),
    getSingleUserByEmail({
      payload,
      email: adminTestAccount.email,
      label: 'admin test',
    }),
  ])

  if (!hasAdminRole(admin)) {
    throw new Error(`"${adminTestAccount.email}" must have the admin role for test execution.`)
  }

  return {
    admin,
    user,
  }
}
