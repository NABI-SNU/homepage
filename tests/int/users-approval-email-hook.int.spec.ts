import { describe, expect, it, vi } from 'vitest'

import { sendApprovalRequestEmail } from '@/collections/Users/hooks/sendApprovalRequestEmail'

describe('Users Approval Email Hook', () => {
  type ApprovalArgs = Parameters<typeof sendApprovalRequestEmail>[0]
  type ApprovalReq = ApprovalArgs['req']

  it('sends approval email for unapproved created users', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined)

    await sendApprovalRequestEmail({
      doc: {
        id: 99,
        email: 'new-user@example.com',
        isApproved: false,
        name: 'New User',
      } as ApprovalArgs['doc'],
      operation: 'create',
      req: {
        payload: {
          sendEmail,
        },
      } as unknown as ApprovalReq,
    } as ApprovalArgs)

    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      to: process.env.USER_APPROVAL_EMAIL_TO || 'admin@nabi.org',
      subject: expect.stringContaining('new-user@example.com'),
    })
  })

  it('does not send approval email for updates or already-approved users', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined)

    await sendApprovalRequestEmail({
      doc: {
        id: 100,
        email: 'approved@example.com',
        isApproved: true,
      } as ApprovalArgs['doc'],
      operation: 'create',
      req: {
        payload: {
          sendEmail,
        },
      } as unknown as ApprovalReq,
    } as ApprovalArgs)

    await sendApprovalRequestEmail({
      doc: {
        id: 101,
        email: 'updated@example.com',
        isApproved: false,
      } as ApprovalArgs['doc'],
      operation: 'update',
      req: {
        payload: {
          sendEmail,
        },
      } as unknown as ApprovalReq,
    } as ApprovalArgs)

    expect(sendEmail).not.toHaveBeenCalled()
  })
})
