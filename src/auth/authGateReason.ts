export const authGateReasons = [
  'account_not_found',
  'admin_approval_required',
  'allowed',
  'email_not_verified',
  'invalid_credentials',
  'unknown',
] as const

export type AuthGateReason = (typeof authGateReasons)[number]

export const isAuthGateReason = (value: string | null | undefined): value is AuthGateReason => {
  return Boolean(value && authGateReasons.includes(value as AuthGateReason))
}

export type AuthResultError = {
  code?: string | null
  message?: string | null
}

type AuthFeedbackContent = {
  description: string
  title: string
}

const normalize = (value: string | null | undefined): string => (value || '').trim().toLowerCase()

const includesAny = (value: string, patterns: readonly string[]): boolean =>
  patterns.some((pattern) => value.includes(pattern))

const unverifiedPatterns = [
  'email_not_verified',
  'email not verified',
  'verify your email',
  'email is not verified',
] as const

const sessionRejectedPatterns = [
  'failed_to_create_session',
  'failed to create session',
  'unable_to_create_session',
  'unable to create session',
] as const

const invalidCredentialPatterns = [
  'invalid_email_or_password',
  'invalid email or password',
  'invalid password',
] as const

const accountNotFoundPatterns = ['user_not_found', 'user not found', 'account not found'] as const

const feedbackByReason: Record<AuthGateReason, AuthFeedbackContent> = {
  account_not_found: {
    title: 'Account not found',
    description: 'No account matched this email. Try Sign Up if you are new.',
  },
  admin_approval_required: {
    title: 'Admin approval required',
    description:
      'Your email requires admin approval before you can sign in. Contact admin@nabilab.org if needed.',
  },
  allowed: {
    title: 'Signed in',
    description: 'Sign-in completed successfully.',
  },
  email_not_verified: {
    title: 'Email not verified',
    description: 'Please verify your email first, then try signing in again.',
  },
  invalid_credentials: {
    title: 'Invalid credentials',
    description: 'The email or password is incorrect. Check both fields and try again.',
  },
  unknown: {
    title: 'Unable to sign in',
    description: 'Sign-in could not be completed. Try again, or use email login for clearer status.',
  },
}

export const getAuthFeedbackForReason = (reason: AuthGateReason): AuthFeedbackContent => {
  return feedbackByReason[reason]
}

export const inferAuthGateReasonFromError = (
  error: AuthResultError | null | undefined,
): AuthGateReason => {
  if (!error) return 'unknown'

  const code = normalize(error.code)
  const message = normalize(error.message)
  const combined = `${code} ${message}`.trim()

  if (!combined) return 'unknown'
  if (includesAny(combined, unverifiedPatterns)) return 'email_not_verified'
  if (includesAny(combined, sessionRejectedPatterns)) return 'admin_approval_required'
  if (includesAny(combined, invalidCredentialPatterns)) return 'invalid_credentials'
  if (includesAny(combined, accountNotFoundPatterns)) return 'account_not_found'

  return 'unknown'
}

export const inferAuthGateReasonFromOAuthErrorQuery = (
  value: string | null | undefined,
): AuthGateReason => {
  const normalized = normalize(value)
  if (!normalized) return 'unknown'
  if (includesAny(normalized, unverifiedPatterns)) return 'email_not_verified'
  if (includesAny(normalized, sessionRejectedPatterns)) return 'admin_approval_required'
  return 'unknown'
}

export const shouldLookupAuthState = (reason: AuthGateReason): boolean => {
  return reason === 'admin_approval_required'
}
