import { describe, expect, it, vi } from 'vitest'

import { sendApprovalRequestEmail } from '@/collections/Users/hooks/sendApprovalRequestEmail'

describe('Users Approval Email Hook', () => {
  it('sends approval email for unapproved created users', async () => {
    const sendEmail = vi.fn().mockResolvedValue(undefined)

    await sendApprovalRequestEmail({
      doc: {
        id: 99,
        email: 'new-user@example.com',
        isApproved: false,
        name: 'New User',
      } as any,
      operation: 'create',
      req: {
        payload: {
          sendEmail,
        },
      } as any,
    } as any)

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
      } as any,
      operation: 'create',
      req: {
        payload: {
          sendEmail,
        },
      } as any,
    } as any)

    await sendApprovalRequestEmail({
      doc: {
        id: 101,
        email: 'updated@example.com',
        isApproved: false,
      } as any,
      operation: 'update',
      req: {
        payload: {
          sendEmail,
        },
      } as any,
    } as any)

    expect(sendEmail).not.toHaveBeenCalled()
  })
})
