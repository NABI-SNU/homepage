import type { CollectionAfterChangeHook } from 'payload'

import type { User } from '@/payload-types'

const CONTEXT_FLAG = 'skipRevealOnApproval'

/**
 * Self-registered accounts are created hidden (`isVisible: false`). Approving one means "this is
 * a member", so it joins the public directory; admins can still hide it again afterwards.
 */
export const revealOnApproval: CollectionAfterChangeHook<User> = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== 'update' || !previousDoc) return doc
  if ((context as Record<string, unknown> | undefined)?.[CONTEXT_FLAG]) return doc
  if (previousDoc.isApproved === true || doc.isApproved !== true) return doc
  if (doc.isVisible !== false) return doc

  await req.payload.update({
    collection: 'users',
    id: doc.id,
    data: { isVisible: true },
    context: { ...(context || {}), [CONTEXT_FLAG]: true },
    depth: 0,
    overrideAccess: true,
    req,
  })

  return { ...doc, isVisible: true }
}
