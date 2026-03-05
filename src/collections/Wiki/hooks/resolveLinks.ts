import type { CollectionBeforeChangeHook } from 'payload'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import {
  buildWikiLookup,
  extractInternalWikiLinkIDs,
  extractWikiLinkTargetsFromEditorState,
  normalizeWikiLookupKey,
  resolveWikiTargetToID,
} from '@/utilities/wikiLinks'

type WikiDocForLookup = {
  aliases?: string[] | null
  id: number | string
  slug?: string | null
  title?: string | null
}

const toSafeEditorState = (value: unknown): DefaultTypedEditorState | null => {
  if (!value || typeof value !== 'object') return null
  return value as DefaultTypedEditorState
}

export const resolveOutgoingWikiLinks: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const nextContent = (data as { content?: unknown })?.content
  const fallbackContent = (originalDoc as { content?: unknown })?.content
  const content = toSafeEditorState(nextContent ?? fallbackContent)
  if (!content) {
    ;(data as { outgoingLinks?: unknown[] }).outgoingLinks =
      (originalDoc as { outgoingLinks?: unknown[] })?.outgoingLinks || []
    ;(data as { unresolvedWikiLinks?: unknown[] }).unresolvedWikiLinks =
      (originalDoc as { unresolvedWikiLinks?: unknown[] })?.unresolvedWikiLinks || []
    return data
  }

  const allWikiDocs = await req.payload.find({
    collection: 'wiki',
    depth: 0,
    limit: 2000,
    overrideAccess: false,
    pagination: false,
    req,
    select: {
      aliases: true,
      id: true,
      slug: true,
      title: true,
    },
  })

  const docs = allWikiDocs.docs as WikiDocForLookup[]
  const lookup = buildWikiLookup(docs)
  const currentDocID =
    operation === 'update'
      ? ((originalDoc as { id?: number | string })?.id ?? (data as { id?: number | string })?.id ?? null)
      : null
  const currentSlug =
    normalizeWikiLookupKey(
      String((data as { slug?: string })?.slug || (originalDoc as { slug?: string })?.slug || ''),
    ) || null

  const explicitLinkIDs = extractInternalWikiLinkIDs(content)
  const parsedWikiTargets = extractWikiLinkTargetsFromEditorState(content)
  const resolvedIDs = new Set<number | string>()
  const unresolvedTargets = new Set<string>()

  explicitLinkIDs.forEach((id) => {
    if (currentDocID !== null && String(currentDocID) === String(id)) return
    resolvedIDs.add(id)
  })

  parsedWikiTargets.forEach((candidate) => {
    const resolved = resolveWikiTargetToID(candidate.target, lookup)
    if (resolved !== null) {
      if (currentDocID !== null && String(currentDocID) === String(resolved)) return
      resolvedIDs.add(resolved)
      return
    }

    const normalizedTarget = normalizeWikiLookupKey(candidate.target)
    if (normalizedTarget && normalizedTarget !== currentSlug) {
      unresolvedTargets.add(candidate.target)
    }
  })

  ;(data as { outgoingLinks?: unknown[] }).outgoingLinks = Array.from(resolvedIDs)
  ;(data as { unresolvedWikiLinks?: { target: string }[] }).unresolvedWikiLinks = Array.from(
    unresolvedTargets,
  ).map((target) => ({ target }))

  return data
}
