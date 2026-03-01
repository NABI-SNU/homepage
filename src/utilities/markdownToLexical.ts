import {
  convertMarkdownToLexical,
  editorConfigFactory,
  type TypedEditorState,
} from '@payloadcms/richtext-lexical'
import configPromise from '../payload.config'
import { getPayload, type CollectionSlug, type Field, type RichTextField } from 'payload'

let payloadPromise: ReturnType<typeof getPayload> | null = null
const editorConfigCache = new Map<string, Awaited<ReturnType<typeof editorConfigFactory.fromField>>>()
const FENCE_PATTERN = /^(\s*)(`{3,}|~{3,})/

export const normalizeMarkdownForLexical = (markdown: string): string => {
  const normalizedNewlines = markdown.replace(/\r\n?/g, '\n')
  const lines = normalizedNewlines.split('\n')
  let activeFence: string | null = null

  const normalizedLines = lines.map((line) => {
    const fenceMatch = line.match(FENCE_PATTERN)

    if (fenceMatch) {
      const marker = fenceMatch[2]
      if (!activeFence) {
        activeFence = marker
        return line
      }

      if (marker[0] === activeFence[0] && marker.length >= activeFence.length) {
        activeFence = null
      }

      return line
    }

    if (activeFence) {
      return line
    }

    if (!line.includes('\t')) {
      return line
    }

    // Normalize tab-indented markdown so nested list/content indentation is parsed consistently.
    return line.replace(/\t/g, '    ')
  })

  return normalizedLines.join('\n')
}

const getPayloadInstance = () => {
  if (!payloadPromise) {
    payloadPromise = getPayload({ config: configPromise })
  }

  return payloadPromise
}

const findFieldByName = (fields: Field[], name: string): RichTextField | null => {
  for (const field of fields) {
    if ('name' in field && field.name === name && field.type === 'richText') {
      return field as RichTextField
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const nested = findFieldByName(field.fields as Field[], name)
      if (nested) return nested
    }

    if ('tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if ('fields' in tab && Array.isArray(tab.fields)) {
          const nested = findFieldByName(tab.fields as Field[], name)
          if (nested) return nested
        }
      }
    }
  }

  return null
}

const getEditorConfigForCollection = async (
  collection: CollectionSlug,
  richTextFieldName = 'content',
) => {
  const cacheKey = `${collection}:${richTextFieldName}`
  const cached = editorConfigCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const payload = await getPayloadInstance()
  const collectionConfig = payload.collections[collection]?.config

  if (!collectionConfig) {
    throw new Error(`Collection config not found: ${collection}`)
  }

  const field = findFieldByName(collectionConfig.fields as Field[], richTextFieldName)

  if (!field) {
    throw new Error(`Rich text field '${richTextFieldName}' not found in collection '${collection}'`)
  }

  const editorConfig = editorConfigFactory.fromField({
    field,
  })

  editorConfigCache.set(cacheKey, editorConfig)
  return editorConfig
}

export const markdownToLexicalByCollection = async (
  markdown: string,
  collection: CollectionSlug,
  richTextFieldName = 'content',
): Promise<TypedEditorState> => {
  const editorConfig = await getEditorConfigForCollection(collection, richTextFieldName)
  const normalizedMarkdown = normalizeMarkdownForLexical(markdown)

  return convertMarkdownToLexical({
    editorConfig,
    markdown: normalizedMarkdown,
  })
}
