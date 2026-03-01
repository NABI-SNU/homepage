import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'
import { isRevalidateDisabled, safeRevalidate } from '@/utilities/safeRevalidate'

export const revalidateContactPage: GlobalAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!isRevalidateDisabled(context)) {
    payload.logger.info('Revalidating contact page global')
    safeRevalidate(payload, 'global contactPage', () => revalidateTag('global_contactPage'))
    safeRevalidate(payload, 'contact page', () => revalidatePath('/contact'))
  }

  return doc
}
