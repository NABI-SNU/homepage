import type { CollectionAfterChangeHook } from 'payload'

import type { User } from '@/payload-types'
import { createUserApprovalToken } from '@/auth/approvalToken'
import { getServerSideURL } from '@/utilities/getURL'

const approvalInbox = process.env.USER_APPROVAL_EMAIL_TO || 'admin@nabi.org'

export const sendApprovalRequestEmail: CollectionAfterChangeHook<User> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc
  if (doc.isApproved === true) return doc

  const token = createUserApprovalToken(doc.id)
  const approvalURL = new URL('/api/account/approve', getServerSideURL())
  approvalURL.searchParams.set('token', token)

  await req.payload.sendEmail({
    from:
      process.env.SMTP_FROM_ADDRESS && process.env.SMTP_FROM_NAME
        ? `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_ADDRESS}>`
        : undefined,
    to: approvalInbox,
    subject: `New NABI user approval requested: ${doc.email}`,
    text: [
      `A new user account requires approval.`,
      `Name: ${doc.name || 'Unknown'}`,
      `Email: ${doc.email}`,
      '',
      `Approve this user: ${approvalURL.toString()}`,
    ].join('\n'),
    html: `
      <p>A new user account requires approval.</p>
      <ul>
        <li><strong>Name:</strong> ${doc.name || 'Unknown'}</li>
        <li><strong>Email:</strong> ${doc.email}</li>
      </ul>
      <p><a href="${approvalURL.toString()}">Approve this user</a></p>
      <p>If the button does not work, copy this URL:</p>
      <p>${approvalURL.toString()}</p>
    `,
  })

  return doc
}
