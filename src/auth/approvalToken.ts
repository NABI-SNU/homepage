import crypto from 'node:crypto'

const DEFAULT_TTL_HOURS = 168

type ApprovalTokenPayload = {
  exp: number
  uid: number
}

const getTokenSecret = (): string => {
  const secret = process.env.USER_APPROVAL_TOKEN_SECRET || process.env.PAYLOAD_SECRET

  if (!secret) {
    throw new Error('[approval-token] Missing USER_APPROVAL_TOKEN_SECRET or PAYLOAD_SECRET.')
  }

  return secret
}

const encodeBase64URL = (value: string): string => {
  return Buffer.from(value, 'utf8').toString('base64url')
}

const decodeBase64URL = (value: string): string => {
  return Buffer.from(value, 'base64url').toString('utf8')
}

const signPayload = (payloadB64: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
}

const constantTimeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) return false

  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

const getTokenTTLHours = (): number => {
  const raw = Number(process.env.USER_APPROVAL_TOKEN_TTL_HOURS || DEFAULT_TTL_HOURS)

  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_TTL_HOURS
  }

  return raw
}

export const createUserApprovalToken = (userID: number): string => {
  const secret = getTokenSecret()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + getTokenTTLHours() * 60 * 60
  const payload: ApprovalTokenPayload = {
    uid: userID,
    exp,
  }
  const payloadB64 = encodeBase64URL(JSON.stringify(payload))
  const signature = signPayload(payloadB64, secret)

  return `${payloadB64}.${signature}`
}

export const verifyUserApprovalToken = (
  token: string | null | undefined,
): { expired: boolean; userID: number | null } => {
  if (!token) return { expired: false, userID: null }

  const [payloadB64, signature] = token.split('.')
  if (!payloadB64 || !signature) {
    return { expired: false, userID: null }
  }

  const secret = getTokenSecret()
  const expectedSignature = signPayload(payloadB64, secret)
  if (!constantTimeEqual(signature, expectedSignature)) {
    return { expired: false, userID: null }
  }

  try {
    const parsed = JSON.parse(decodeBase64URL(payloadB64)) as Partial<ApprovalTokenPayload>
    const uid = Number(parsed.uid)
    const exp = Number(parsed.exp)

    if (!Number.isInteger(uid) || uid <= 0 || !Number.isFinite(exp)) {
      return { expired: false, userID: null }
    }

    const now = Math.floor(Date.now() / 1000)
    if (exp < now) {
      return { expired: true, userID: null }
    }

    return {
      expired: false,
      userID: uid,
    }
  } catch {
    return { expired: false, userID: null }
  }
}
