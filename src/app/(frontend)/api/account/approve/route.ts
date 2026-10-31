import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { hasAdminRole } from '@/access/hasAdminRole'
import { verifyUserApprovalToken } from '@/auth/approvalToken'
import { getServerUser } from '@/auth/session'
import type { User } from '@/payload-types'

/**
 * User approval from the admin notification email.
 *
 * GET only *shows* a confirmation page (it never changes anything, so link scanners, mail
 * previews and prefetches cannot approve anyone). The approval itself happens on POST, which
 * requires both the signed token from the email and an admin Better Auth session.
 */

const redirectWithStatus = (req: NextRequest, approval: string) => {
  const url = new URL('/account', req.url)
  url.searchParams.set('approval', approval)
  return Response.redirect(url, 302)
}

const escapeHTML = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string,
  )

const htmlResponse = (body: string, status = 200): Response =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Approve user</title><style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;line-height:1.5;color:#1f1f1f}button,a.button{display:inline-block;background:#1f1f1f;color:#fff;border:0;border-radius:.5rem;padding:.75rem 1.25rem;font:inherit;cursor:pointer;text-decoration:none}dl{display:grid;grid-template-columns:auto 1fr;gap:.25rem 1rem}dt{color:#666}</style></head><body>${body}</body></html>`,
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': 'text/html; charset=utf-8',
      },
      status,
    },
  )

type PendingApproval =
  | { kind: 'redirect'; response: Response }
  | { kind: 'pending'; payload: Awaited<ReturnType<typeof getPayload>>; user: User }

const loadPendingApproval = async (req: NextRequest, token: string | null) => {
  const parsedToken = verifyUserApprovalToken(token)

  if (parsedToken.expired) {
    return { kind: 'redirect', response: redirectWithStatus(req, 'expired') } as PendingApproval
  }
  if (!parsedToken.userID) {
    return { kind: 'redirect', response: redirectWithStatus(req, 'invalid') } as PendingApproval
  }

  const payload = await getPayload({ config: configPromise })
  const user = await payload
    .findByID({
      collection: 'users',
      id: parsedToken.userID,
      depth: 0,
      disableErrors: true,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!user) {
    return { kind: 'redirect', response: redirectWithStatus(req, 'not-found') } as PendingApproval
  }
  if (user.isApproved === true) {
    return { kind: 'redirect', response: redirectWithStatus(req, 'already') } as PendingApproval
  }

  return { kind: 'pending', payload, user } as PendingApproval
}

const isAdminSession = async (
  req: NextRequest,
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<boolean> => {
  const sessionUser = await getServerUser<User>(payload, req.headers)
  return Boolean(sessionUser && hasAdminRole(sessionUser))
}

export async function GET(req: NextRequest): Promise<Response> {
  const token = req.nextUrl.searchParams.get('token')
  const pending = await loadPendingApproval(req, token)
  if (pending.kind === 'redirect') return pending.response

  const { payload, user } = pending
  const admin = await isAdminSession(req, payload)
  const details = `<dl><dt>Name</dt><dd>${escapeHTML(user.name || 'Unknown')}</dd><dt>Email</dt><dd>${escapeHTML(user.email ?? user.contactEmail ?? '—')}</dd></dl>`

  if (!admin) {
    const loginURL = new URL('/account', req.url)
    loginURL.searchParams.set('mode', 'login')
    return htmlResponse(
      `<h1>Sign in to approve</h1><p>Approving a user requires an admin session. Sign in, then open the approval link from the email again.</p>${details}<p><a class="button" href="${escapeHTML(loginURL.toString())}">Sign in</a></p>`,
      401,
    )
  }

  return htmlResponse(
    `<h1>Approve this user?</h1><p>They will be able to sign in to the member workspace.</p>${details}<form method="post"><input type="hidden" name="token" value="${escapeHTML(token || '')}"><button type="submit">Approve user</button></form>`,
  )
}

export async function POST(req: NextRequest): Promise<Response> {
  const contentType = req.headers.get('content-type') || ''
  let token: string | null = null

  if (contentType.includes('application/json')) {
    const body = (await req.json().catch(() => ({}))) as { token?: unknown }
    token = typeof body.token === 'string' ? body.token : null
  } else {
    const form = await req.formData().catch(() => null)
    const value = form?.get('token')
    token = typeof value === 'string' ? value : null
  }

  const pending = await loadPendingApproval(req, token)
  if (pending.kind === 'redirect') return pending.response

  const { payload, user } = pending

  if (!(await isAdminSession(req, payload))) {
    return redirectWithStatus(req, 'forbidden')
  }

  try {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        isApproved: true,
      },
      depth: 0,
      overrideAccess: true,
    })

    payload.logger.info(`[auth] User ${user.id} (${user.email}) approved via email link.`)
    return redirectWithStatus(req, 'approved')
  } catch {
    return redirectWithStatus(req, 'error')
  }
}
