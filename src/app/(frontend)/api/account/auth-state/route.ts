import { NextRequest } from 'next/server'

import { getAuthFeedbackForReason, type AuthGateReason } from '@/auth/authGateReason'

type RequestBody = {
  email?: string
  intent?: 'login'
}

type AuthStateResponse = {
  allowed: boolean
  message: string
  reason: AuthGateReason
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

export async function POST(req: NextRequest): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as RequestBody
  const normalizedEmail = normalizeEmail(body.email)

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    return Response.json(buildResponse('unknown'), { status: 400 })
  }

  try {
    return Response.json(buildResponse('unknown'))
  } catch (error) {
    console.error('[auth-state] Failed to resolve auth state.', error)
    return Response.json(buildResponse('unknown'))
  }
}
