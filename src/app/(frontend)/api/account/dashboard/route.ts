import { NextRequest } from 'next/server'

import {
  getAccountDashboardData,
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

  const dashboard = await getAccountDashboardData(context)

  return privateAccountResponse(dashboard, { headers: context.responseHeaders })
}
