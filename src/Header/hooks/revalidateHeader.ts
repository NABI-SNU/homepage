import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!isRevalidateDisabled(context)) {
    payload.logger.info(`Revalidating header`)

    safeRevalidate(payload, 'global header', () => revalidateTag('global_header', { expire: 0 }))
    safeRevalidate(payload, 'root layout', () => revalidatePath('/', 'layout'))
  }

  return doc
}
