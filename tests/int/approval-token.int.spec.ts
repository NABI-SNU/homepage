import { describe, expect, it } from 'vitest'

import { createUserApprovalToken, verifyUserApprovalToken } from '@/auth/approvalToken'

describe('Approval Token', () => {
  it('creates and verifies a valid token', () => {
    const token = createUserApprovalToken(123)
    const parsed = verifyUserApprovalToken(token)

    expect(parsed.expired).toBe(false)
    expect(parsed.userID).toBe(123)
  })

  it('marks token as expired after ttl passes', async () => {
    const originalTTL = process.env.USER_APPROVAL_TOKEN_TTL_HOURS

    try {
      process.env.USER_APPROVAL_TOKEN_TTL_HOURS = '0.0002'

      const token = createUserApprovalToken(42)

      await new Promise((resolve) => {
        setTimeout(resolve, 1_200)
      })

      const parsed = verifyUserApprovalToken(token)

      expect(parsed.expired).toBe(true)
      expect(parsed.userID).toBeNull()
    } finally {
      if (originalTTL === undefined) {
        delete process.env.USER_APPROVAL_TOKEN_TTL_HOURS
      } else {
        process.env.USER_APPROVAL_TOKEN_TTL_HOURS = originalTTL
      }
    }
  })
})
