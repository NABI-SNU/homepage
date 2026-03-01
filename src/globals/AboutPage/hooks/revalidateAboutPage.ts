import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateAboutPage: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!isRevalidateDisabled(context)) {
    payload.logger.info('Revalidating about page global')
    safeRevalidate(payload, 'global aboutPage', () => revalidateTag('global_aboutPage'))
    safeRevalidate(payload, 'about page', () => revalidatePath('/about'))
  }

  return doc
}
