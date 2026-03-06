import 'dotenv/config'

import { getPayload, type Payload } from 'payload'

import config from '../src/payload.config'

type TestAccountSeed = {
  betterAuthUserId: string
  email: string
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
    isApproved: true,
    betterAuthUserId: 'ci-fixed-test-user',
  },
  {
    email: 'dev@payloadcms.com',
    name: 'Payload Admin',
    password: 'test',
    roles: 'admin',
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
    isApproved: account.isApproved,
    name: account.name,
    password: account.password,
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
    depth: 0,
    overrideAccess: true,
  })

  payload.logger.info(`[seed-test-accounts] Created ${account.email}`)
}

const run = async (): Promise<void> => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  for (const account of testAccountSeeds) {
    await upsertTestAccount({ account, payload })
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
