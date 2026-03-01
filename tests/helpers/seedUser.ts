import { Pool } from 'pg'
import { getPayload } from 'payload'

import { auth } from '../../src/auth/betterAuth'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  name: 'Payload Admin',
  password: 'test-password-1234',
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const deleteBetterAuthUserByEmail = async (email: string): Promise<void> => {
  const safeQuery = async (statement: string) => {
    try {
      await pool.query(statement, [email])
    } catch {
      // BetterAuth tables may not exist until migrations run.
    }
  }

  await safeQuery('DELETE FROM "session" WHERE "userId" IN (SELECT "id" FROM "user" WHERE "email" = $1)')
  await safeQuery('DELETE FROM "account" WHERE "userId" IN (SELECT "id" FROM "user" WHERE "email" = $1)')
  await safeQuery('DELETE FROM "verification" WHERE "identifier" = $1')
  await safeQuery('DELETE FROM "user" WHERE "email" = $1')
}

/**
 * Seeds an admin user for e2e tests using BetterAuth.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await deleteBetterAuthUserByEmail(testUser.email)

  await payload.delete({
    collection: 'people',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  await auth.api.signUpEmail({
    body: {
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
    },
  })

  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  const user = users.docs[0]

  if (!user) {
    throw new Error('Failed to seed synced Payload user from BetterAuth sign up')
  }

  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      isApproved: true,
      roles: 'admin',
      name: testUser.name,
    },
    overrideAccess: true,
  })
}

/**
 * Cleans up test user after tests.
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'people',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  await deleteBetterAuthUserByEmail(testUser.email)
}
