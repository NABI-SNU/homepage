export const toTagSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

type ResearchInput = string | string[] | null | undefined

export const parseResearchTags = (value: ResearchInput): string[] => {
  if (!value) return []

  const seen = new Set<string>()
  const tags: string[] = []
  const sources = Array.isArray(value) ? value : [value]

  for (const source of sources) {
    if (!source) continue

    for (const part of source.split(',')) {
      const cleaned = part.trim()
      if (!cleaned) continue

      const dedupeKey = cleaned.toLowerCase()
      if (seen.has(dedupeKey)) continue

      seen.add(dedupeKey)
      tags.push(cleaned)
    }
  }

  return tags
}
