import { describe, expect, it } from 'vitest'

import {
  getAuthFeedbackForReason,
  inferAuthGateReasonFromError,
  inferAuthGateReasonFromOAuthErrorQuery,
  shouldLookupAuthState,
} from '@/auth/authGateReason'

describe('authGateReason helpers', () => {
  it('maps common BetterAuth errors to gate reasons', () => {
    expect(
      inferAuthGateReasonFromError({
        code: 'EMAIL_NOT_VERIFIED',
      }),
    ).toBe('email_not_verified')

    expect(
      inferAuthGateReasonFromError({
        code: 'FAILED_TO_CREATE_SESSION',
      }),
    ).toBe('admin_approval_required')

    expect(
      inferAuthGateReasonFromError({
        code: 'INVALID_EMAIL_OR_PASSWORD',
      }),
    ).toBe('invalid_credentials')
  })

  it('maps OAuth callback query errors to gate reasons', () => {
    expect(inferAuthGateReasonFromOAuthErrorQuery('email_not_verified')).toBe('email_not_verified')
    expect(inferAuthGateReasonFromOAuthErrorQuery('unable_to_create_session')).toBe(
      'admin_approval_required',
    )
    expect(inferAuthGateReasonFromOAuthErrorQuery('something_else')).toBe('unknown')
  })

  it('returns actionable feedback and lookup flags', () => {
    const feedback = getAuthFeedbackForReason('admin_approval_required')
    expect(feedback.title.toLowerCase()).toContain('approval')
    expect(shouldLookupAuthState('admin_approval_required')).toBe(true)
    expect(shouldLookupAuthState('email_not_verified')).toBe(false)
  })
})
