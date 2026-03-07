import { headers as getRequestHeaders, draftMode } from 'next/headers'
import { cache } from 'react'
import { getPayload } from 'payload'

import configPromise from '@payload-config'
import type { User } from '@/payload-types'
import { resolvePayloadUserFromHeaders } from '@/auth/resolvePayloadUserFromHeaders'

type DraftAccessContext = {
  draft: boolean
  payload: Awaited<ReturnType<typeof getPayload>>
  user: User | null
}

export const getDraftAccessContext = cache(async (): Promise<DraftAccessContext> => {
  const payload = await getPayload({ config: configPromise })
  const { isEnabled } = await draftMode()

  if (!isEnabled) {
    return {
      draft: false,
      payload,
      user: null,
    }
  }

  const requestHeaders = await getRequestHeaders()
  const { user } = await resolvePayloadUserFromHeaders({
    headers: requestHeaders,
    payload,
  })

  return {
    draft: Boolean(user),
    payload,
    user,
  }
})
