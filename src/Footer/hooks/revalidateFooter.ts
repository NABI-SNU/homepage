import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!isRevalidateDisabled(context)) {
    payload.logger.info(`Revalidating footer`)

    safeRevalidate(payload, 'global footer', () => revalidateTag('global_footer'))
  }

  return doc
}
