import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateHomePage: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!isRevalidateDisabled(context)) {
    payload.logger.info('Revalidating home page global')
    safeRevalidate(payload, 'global homePage', () => revalidateTag('global_homePage'))
    safeRevalidate(payload, 'home page', () => revalidatePath('/'))
  }

  return doc
}
