import { getPayload } from 'payload'
import { NextRequest } from 'next/server'

import configPromise from '@payload-config'
import { verifyUserApprovalToken } from '@/auth/approvalToken'

const redirectWithStatus = (req: NextRequest, approval: string) => {
  const url = new URL('/account', req.url)
  url.searchParams.set('approval', approval)
  return Response.redirect(url, 302)
}

export async function GET(req: NextRequest): Promise<Response> {
  const token = req.nextUrl.searchParams.get('token')
  const parsedToken = verifyUserApprovalToken(token)

  if (parsedToken.expired) return redirectWithStatus(req, 'expired')
  if (!parsedToken.userID) return redirectWithStatus(req, 'invalid')

  try {
    const payload = await getPayload({ config: configPromise })

    const user = await payload.findByID({
      collection: 'users',
      id: parsedToken.userID,
      depth: 0,
      overrideAccess: true,
    })

    if (!user) {
      return redirectWithStatus(req, 'not-found')
    }

    if (user.isApproved === true) {
      return redirectWithStatus(req, 'already')
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        isApproved: true,
      },
      depth: 0,
      overrideAccess: true,
    })

    return redirectWithStatus(req, 'approved')
  } catch {
    return redirectWithStatus(req, 'error')
  }
}
