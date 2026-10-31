import { NextRequest } from 'next/server'

import {
  buildAccountCapabilities,
  privateAccountResponse,
  resolveAccountRequestContext,
} from '@/utilities/accountAccess'

export async function GET(req: NextRequest): Promise<Response> {
  const context = await resolveAccountRequestContext(req)

  // Public pages ask for capabilities to decide whether to show "edit" affordances, so an
  // anonymous visitor is a normal answer, not an error (and not a console 401 on every page).
  if (!context.user) {
    return privateAccountResponse(
      { linkedPerson: null, permissions: null, user: null },
      { headers: context.responseHeaders },
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
