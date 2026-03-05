import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

type WikiLinkCandidate = {
  label: string
  target: string
}

export type WikiLinkMatch = WikiLinkCandidate & {
  end: number
  start: number
}

const WIKI_LINK_PATTERN = /\[\[([^[\]]+?)\]\]/g

const normalizeWhitespace = (value: string): string => value.trim().replace(/\s+/g, ' ')

export const slugifyWikiTarget = (value: string): string =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const normalizeWikiLookupKey = (value: string): string => slugifyWikiTarget(value)

export const parseWikiLinks = (input: string): WikiLinkCandidate[] => {
  const results: WikiLinkCandidate[] = []
  findWikiLinkMatches(input).forEach(({ label, target }) => results.push({ label, target }))

  return results
}

export const findWikiLinkMatches = (input: string): WikiLinkMatch[] => {
  const results: WikiLinkMatch[] = []
  let match: RegExpExecArray | null = null

  while (true) {
    match = WIKI_LINK_PATTERN.exec(input)
    if (!match) break

    const body = match[1]?.trim()
    if (!body) continue

    const [targetRaw, aliasRaw] = body.split('|')
    const target = normalizeWhitespace(targetRaw || '')
    if (!target) continue

    const label = normalizeWhitespace(aliasRaw || target)
    const raw = match[0]
    const start = match.index
    const end = start + raw.length

    results.push({
      end,
      label: label || target,
      start,
      target,
    })
  }

  return results
}

const collectTextNodes = (node: unknown, sink: string[]): void => {
  if (!node || typeof node !== 'object') return

  const maybeNode = node as {
    text?: unknown
    children?: unknown
  }

  if (typeof maybeNode.text === 'string') {
    sink.push(maybeNode.text)
  }

  if (Array.isArray(maybeNode.children)) {
    maybeNode.children.forEach((child) => collectTextNodes(child, sink))
  }
}

type InternalWikiLinkValue = number | string

const collectInternalWikiLinks = (node: unknown, sink: Set<InternalWikiLinkValue>): void => {
  if (!node || typeof node !== 'object') return

  const maybeNode = node as {
    type?: unknown
    fields?: {
      linkType?: unknown
      doc?: {
        relationTo?: unknown
        value?: unknown
      }
    }
    children?: unknown
  }

  if (
    maybeNode.type === 'link' &&
    maybeNode.fields?.linkType === 'internal' &&
    maybeNode.fields?.doc?.relationTo === 'wiki'
  ) {
    const value = maybeNode.fields.doc.value
    if (typeof value === 'number' || typeof value === 'string') {
      sink.add(value)
    } else if (value && typeof value === 'object' && 'id' in value) {
      const id = (value as { id?: unknown }).id
      if (typeof id === 'number' || typeof id === 'string') {
        sink.add(id)
      }
    }
  }

  if (Array.isArray(maybeNode.children)) {
    maybeNode.children.forEach((child) => collectInternalWikiLinks(child, sink))
  }
}

export const extractWikiLinkTargetsFromEditorState = (
  state: DefaultTypedEditorState | null | undefined,
): WikiLinkCandidate[] => {
  if (!state || typeof state !== 'object') return []

  const texts: string[] = []
  const root = (state as { root?: unknown }).root ?? state
  collectTextNodes(root, texts)

  const dedup = new Set<string>()
  const parsed: WikiLinkCandidate[] = []

  texts.forEach((text) => {
    parseWikiLinks(text).forEach((candidate) => {
      const key = `${candidate.target}|${candidate.label}`
      if (dedup.has(key)) return
      dedup.add(key)
      parsed.push(candidate)
    })
  })

  return parsed
}

export const extractInternalWikiLinkIDs = (
  state: DefaultTypedEditorState | null | undefined,
): Set<InternalWikiLinkValue> => {
  const linkIDs = new Set<InternalWikiLinkValue>()
  if (!state || typeof state !== 'object') return linkIDs

  const root = (state as { root?: unknown }).root ?? state
  collectInternalWikiLinks(root, linkIDs)
  return linkIDs
}

type WikiLookupDoc = {
  aliases?: string[] | null
  id: number | string
  slug?: string | null
  title?: string | null
}

export const buildWikiLookup = (docs: WikiLookupDoc[]) => {
  const keyToID = new Map<string, WikiLookupDoc['id']>()
  const idToSlug = new Map<WikiLookupDoc['id'], string>()

  docs.forEach((doc) => {
    const slug = normalizeWhitespace(doc.slug || '')
    const title = normalizeWhitespace(doc.title || '')
    const aliases = (doc.aliases || []).map((value) => normalizeWhitespace(value || '')).filter(Boolean)

    const keys = new Set<string>()
    ;[slug, title, ...aliases].forEach((value) => {
      if (!value) return
      keys.add(normalizeWikiLookupKey(value))
      keys.add(normalizeWhitespace(value).toLowerCase())
    })

    if (slug) {
      idToSlug.set(doc.id, slug)
    }

    keys.forEach((key) => {
      if (!key) return
      if (!keyToID.has(key)) {
        keyToID.set(key, doc.id)
      }
    })
  })

  return {
    idToSlug,
    keyToID,
  }
}

export const resolveWikiTargetToID = (
  target: string,
  lookup: ReturnType<typeof buildWikiLookup>,
): number | string | null => {
  const normalized = normalizeWhitespace(target)
  if (!normalized) return null

  const options = [normalizeWikiLookupKey(normalized), normalized.toLowerCase()]

  for (const key of options) {
    if (!key) continue
    const resolved = lookup.keyToID.get(key)
    if (resolved !== undefined) return resolved
  }

  return null
}
