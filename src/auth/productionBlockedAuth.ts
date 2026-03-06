const DEFAULT_BLOCKED_EMAILS = ['test@example.com', 'dev@payloadcms.com'] as const

const parseList = (value: string | undefined): string[] => {
  return (value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

const normalizeEmail = (email: string | null | undefined): string | null => {
  const normalized = email?.trim().toLowerCase()
  return normalized && normalized.length > 0 ? normalized : null
}

const getProductionBlockedEmails = (): Set<string> => {
  return new Set([
    ...DEFAULT_BLOCKED_EMAILS,
    ...parseList(process.env.AUTH_PRODUCTION_BLOCKED_EMAILS),
  ])
}

export const isProductionBlockedAuthEmail = (email: string | null | undefined): boolean => {
  if (process.env.NODE_ENV !== 'production') return false

  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return false

  return getProductionBlockedEmails().has(normalizedEmail)
}
