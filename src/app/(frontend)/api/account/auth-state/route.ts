import { getPayload } from 'payload'
import type { Pool } from 'pg'

import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { getAuthFeedbackForReason, type AuthGateReason } from '@/auth/authGateReason'
import { resolvePayloadUserFromSessionWithReason } from '@/auth/resolvePayloadUserFromSession'
import { createStoragePool } from '@/utilities/storageDatabase'

type BetterAuthUserRow = {
  email: string | null
  emailVerified: boolean | null
  id: string
}

type RequestBody = {
  email?: string
  intent?: 'login'
}

type AuthStateResponse = {
  allowed: boolean
  message: string
  reason: AuthGateReason
}

let pool: Pool | null = null

const getPool = (): Pool => {
  if (!pool) {
    pool = createStoragePool()
  }

  return pool
}

const normalizeEmail = (value: string | null | undefined): string | null => {
  const normalized = value?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

const buildResponse = (reason: AuthGateReason, allowed = false): AuthStateResponse => ({
  allowed,
  reason,
  message: getAuthFeedbackForReason(reason).description,
})

const findBetterAuthUserByEmail = async (email: string): Promise<BetterAuthUserRow | null> => {
  const storagePool = getPool()

  const result = await storagePool.query<BetterAuthUserRow>(
    'SELECT "id", "email", "emailVerified" FROM "user" WHERE lower("email") = $1 LIMIT 1',
    [email],
  )

  return result.rows[0] ?? null
}

export async function POST(req: NextRequest): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as RequestBody
  const normalizedEmail = normalizeEmail(body.email)

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return Response.json(buildResponse('unknown'), { status: 400 })
  }

  try {
    const betterAuthUser = await findBetterAuthUserByEmail(normalizedEmail)
    if (!betterAuthUser) {
      return Response.json(buildResponse('account_not_found'))
    }

    const payload = await getPayload({ config: configPromise })
    const resolved = await resolvePayloadUserFromSessionWithReason({
      payload,
      betterAuthUser: {
        id: betterAuthUser.id,
        email: betterAuthUser.email,
        emailVerified: betterAuthUser.emailVerified === true,
      },
      requireApproval: true,
      autoApproveByPeopleEmail: true,
      enforceProductionEmailVerification: true,
    })

    return Response.json(
      buildResponse(resolved.reason, Boolean(resolved.user) && resolved.reason === 'allowed'),
    )
  } catch (error) {
    console.error('[auth-state] Failed to resolve auth state.', error)
    return Response.json(buildResponse('unknown'))
  }
}
