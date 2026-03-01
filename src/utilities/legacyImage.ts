type LegacyTextNode = {
  text?: string
  type?: string
}

export type LegacyInlineImage = {
  alt: string
  height?: number
  src: string
  width?: number
  widthStyle?: string
}

const IMG_TAG_PATTERN = /^<img\b([^>]*)\/?>\s*(?:<\/img>)?$/i
const IMG_ATTR_PATTERN = /([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g

const readNodeText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''

  const candidate = node as LegacyTextNode

  if (candidate.type === 'text') return typeof candidate.text === 'string' ? candidate.text : ''
  if (candidate.type === 'linebreak') return '\n'
  if (candidate.type === 'tab') return '\t'

  return ''
}

export const parseLegacyImageTag = (rawText: string): LegacyInlineImage | null => {
  const text = rawText.trim()
  const tagMatch = text.match(IMG_TAG_PATTERN)
  if (!tagMatch) return null

  const attrs = tagMatch[1] ?? ''
  const parsedAttrs: Record<string, string> = {}

  for (const match of attrs.matchAll(IMG_ATTR_PATTERN)) {
    const key = match[1]?.toLowerCase()
    const value = match[3] ?? match[4] ?? match[5] ?? ''
    if (key) parsedAttrs[key] = value
  }

  const src = parsedAttrs.src || ''
  if (!src || !/^(https?:\/\/|\/)/i.test(src)) return null

  const width = parsedAttrs.width ? Number(parsedAttrs.width) : undefined
  const height = parsedAttrs.height ? Number(parsedAttrs.height) : undefined
  const styleWidthMatch = parsedAttrs.style?.match(/(?:^|;)\s*width\s*:\s*([^;]+)/i)
  const widthStyle = styleWidthMatch?.[1]?.trim()

  return {
    alt: parsedAttrs.alt || '',
    height: Number.isFinite(height) ? height : undefined,
    src,
    width: Number.isFinite(width) ? width : undefined,
    widthStyle,
  }
}

export const extractLegacyImageFromLexical = (content: unknown): LegacyInlineImage | null => {
  if (!content || typeof content !== 'object') return null

  const root = (content as { root?: { children?: unknown[] } }).root
  const children = root?.children
  if (!Array.isArray(children)) return null

  for (const child of children) {
    if (!child || typeof child !== 'object') continue
    const paragraph = child as { children?: unknown[]; type?: string }
    if (paragraph.type !== 'paragraph' || !Array.isArray(paragraph.children)) continue

    const text = paragraph.children.map(readNodeText).join('')
    const parsed = parseLegacyImageTag(text)
    if (parsed) return parsed
  }

  return null
}
