import type { Payload } from 'payload'

import type { User } from '@/payload-types'

import { getBetterAuthUserFromHeaders } from './getBetterAuthUserFromHeaders'
import { strictPayloadSessionResolutionOptions } from './payloadSessionPolicy'
import { resolvePayloadUserFromSession } from './resolvePayloadUserFromSession'

type HeaderRecord = Record<string, string | string[] | undefined>

export const resolvePayloadUserFromHeaders = async ({
  headers,
  payload,
}: {
  headers: Headers | HeaderRecord
  payload: Payload
}): Promise<{ responseHeaders: Headers; user: User | null }> => {
  const { betterAuthUser, responseHeaders } = await getBetterAuthUserFromHeaders(headers)
  const user = await resolvePayloadUserFromSession({
    payload,
    betterAuthUser,
    ...strictPayloadSessionResolutionOptions,
  })

  return {
    responseHeaders,
    user,
  }
}
