import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (isRevalidateDisabled(context)) {
    return doc
  }

  payload.logger.info(`Revalidating redirects`)

  safeRevalidate(payload, 'redirects', () => revalidateTag('redirects'))

  return doc
}
