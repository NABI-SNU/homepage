import 'dotenv/config'

import { hashPassword } from 'better-auth/crypto'
import { getPayload, type Payload } from 'payload'

import config from '../src/payload.config'

type TestAccountSeed = {
  betterAuthUserId: string
  email: string
  emailVerified: boolean
  isApproved: boolean
  name: string
  password: string
  roles: 'admin' | 'user'
}

const testAccountSeeds: TestAccountSeed[] = [
  {
    email: 'test@example.com',
    name: 'Test User',
    password: 'test',
    roles: 'user',
    emailVerified: true,
    isApproved: true,
    betterAuthUserId: 'ci-fixed-test-user',
  },
  {
    email: 'dev@payloadcms.com',
    name: 'Payload Admin',
    password: 'test',
    roles: 'admin',
    emailVerified: true,
    isApproved: true,
    betterAuthUserId: 'ci-fixed-admin-user',
  },
]

const upsertTestAccount = async ({
  account,
  payload,
}: {
  account: TestAccountSeed
  payload: Payload
}): Promise<void> => {
  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: account.email,
      },
    },
  })

  if (users.docs.length > 1) {
    throw new Error(`Duplicate users found for ${account.email}.`)
  }

  const existingUser = users.docs[0]
  const data = {
    betterAuthUserId: account.betterAuthUserId,
    email: account.email,
    emailVerified: account.emailVerified,
    isApproved: account.isApproved,
    name: account.name,
    password: account.password,
    role: account.roles,
    roles: account.roles,
  }

  if (existingUser) {
    await payload.update({
      collection: 'users',
      id: existingUser.id,
      data,
      depth: 0,
      overrideAccess: true,
    })

    payload.logger.info(`[seed-test-accounts] Updated ${account.email}`)
    return
  }

  await payload.create({
    collection: 'users',
    data,
    draft: false,
    depth: 0,
    overrideAccess: true,
  })

  payload.logger.info(`[seed-test-accounts] Created ${account.email}`)
}

/**
 * The Users collection has no local password strategy — sign-in goes through Better Auth, which
 * keeps the password hash on a `credential` row in `accounts`. Without this row the seeded user
 * exists but "User not found" is returned on sign-in, so make sure the row exists.
 */
const ensureCredentialAccount = async ({
  account,
  payload,
}: {
  account: TestAccountSeed
  payload: Payload
}): Promise<void> => {
  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { email: { equals: account.email } },
  })
  const user = users.docs[0]
  if (!user) return

  const existing = await payload.find({
    collection: 'accounts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ user: { equals: user.id } }, { providerId: { equals: 'credential' } }],
    },
  })

  const password = await hashPassword(account.password)

  if (existing.docs[0]) {
    await payload.update({
      collection: 'accounts',
      id: existing.docs[0].id,
      data: { password },
      depth: 0,
      overrideAccess: true,
    })
    return
  }

  await payload.create({
    collection: 'accounts',
    data: {
      accountId: String(user.id),
      password,
      providerId: 'credential',
      user: user.id,
    },
    depth: 0,
    overrideAccess: true,
  })
  payload.logger.info(`[seed-test-accounts] Created credential account for ${account.email}`)
}

const run = async (): Promise<void> => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  for (const account of testAccountSeeds) {
    await upsertTestAccount({ account, payload })
    await ensureCredentialAccount({ account, payload })
  }
}

run()
  .then(() => {
    console.log('Seeded fixed test accounts.')
  })
  .catch((error) => {
    console.error('Failed to seed fixed test accounts:', error)
    process.exitCode = 1
  })
  // Payload keeps the DB pool open, which would otherwise hold the process (and CI step) forever.
  .finally(() => process.exit())
