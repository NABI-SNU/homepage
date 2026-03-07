import { NextRequest } from 'next/server'

import {
  buildAccountCapabilities,
  privateAccountResponse,
  resolveAccountRequestContext,
} from '@/utilities/accountAccess'

export async function GET(req: NextRequest): Promise<Response> {
  const context = await resolveAccountRequestContext(req)

  if (!context.user) {
    return privateAccountResponse(
      { error: 'Unauthorized' },
      { headers: context.responseHeaders, status: 401 },
    )
  }

  return privateAccountResponse(
    buildAccountCapabilities({
      linkedPerson: context.linkedPerson,
      permissions: context.permissions,
      user: context.user,
    }),
    { headers: context.responseHeaders },
  )
}
