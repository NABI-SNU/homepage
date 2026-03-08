import type { PayloadRequest } from 'payload'

const ACCESS_CACHE_KEY = '__nabiAccessCache'

type AccessCache = {
  isAdminRequest?: boolean
  linkedPersonIDs?: number[]
  publishedNotebookIDs?: number[]
}

export const getAccessCache = (req: PayloadRequest): AccessCache => {
  const context = (req.context ?? {}) as Record<string, unknown>

  if (!req.context || typeof req.context !== 'object') {
    ;(req as PayloadRequest & { context: Record<string, unknown> }).context = context
  }

  const existingCache = context[ACCESS_CACHE_KEY]
  if (existingCache && typeof existingCache === 'object') {
    return existingCache as AccessCache
  }

  const cache: AccessCache = {}
  context[ACCESS_CACHE_KEY] = cache
  return cache
}
