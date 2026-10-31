import type { Access } from 'payload'

import { isAdminRequest } from './adminOnly'

/**
 * Admins see everything; everyone else — anonymous *and* signed-in members — only sees
 * published documents. Use this for collections that only admins edit, so that a plain
 * member's REST/GraphQL access cannot reveal unpublished drafts.
 */
export const adminOrPublished: Access = async ({ req }) => {
  if (req.user && (await isAdminRequest(req))) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
