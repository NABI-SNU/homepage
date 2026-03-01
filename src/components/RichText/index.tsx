import { MediaBlock } from '@/blocks/MediaBlock/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'
import { YouTubeEmbedBlock, YouTubeEmbedBlockProps } from '@/blocks/YouTubeEmbed/Component'

import type {
  BannerBlock as BannerBlockProps,
  MediaBlock as MediaBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { parseLegacyImageTag } from '@/utilities/legacyImage'
import { cn } from '@/utilities/ui'
import type { ReactNode } from 'react'

type NodeTypes =
  | DefaultNodeTypes
  | SerializedBlockNode<MediaBlockProps | BannerBlockProps | CodeBlockProps | YouTubeEmbedBlockProps>

type LegacyTextNode = {
  type?: string
  text?: string
  [key: string]: unknown
}

type LegacyListEntry = {
  level: number
  nodes: LegacyTextNode[]
}

type LegacyListItem = {
  children: LegacyListItem[]
  nodes: LegacyTextNode[]
}

type LegacyTableData = {
  headers: string[]
  rows: string[][]
}

const getNodeText = (node: LegacyTextNode): string => {
  if (node.type === 'text') return typeof node.text === 'string' ? node.text : ''
  if (node.type === 'linebreak') return '\n'
  if (node.type === 'tab') return '\t'
  return ''
}

const splitNodesIntoLines = (nodes: LegacyTextNode[]) => {
  const lines: LegacyTextNode[][] = [[]]

  nodes.forEach((node) => {
    if (node.type === 'linebreak') {
      lines.push([])
      return
    }

    lines[lines.length - 1].push(node)
  })

  return lines
}

const stripLeadingChars = (nodes: LegacyTextNode[], count: number): LegacyTextNode[] => {
  let remaining = count
  const result: LegacyTextNode[] = []

  nodes.forEach((node) => {
    if (remaining <= 0) {
      result.push(node)
      return
    }

    if (node.type === 'tab') {
      remaining -= 1
      return
    }

    if (node.type !== 'text') {
      return
    }

    const text = typeof node.text === 'string' ? node.text : ''

    if (text.length <= remaining) {
      remaining -= text.length
      return
    }

    result.push({
      ...node,
      text: text.slice(remaining),
    })
    remaining = 0
  })

  return result.filter((node) => {
    if (node.type !== 'text') return true
    return typeof node.text === 'string' && node.text.length > 0
  })
}

const parseLegacyListEntry = (lineNodes: LegacyTextNode[]): LegacyListEntry | null => {
  const lineText = lineNodes.map(getNodeText).join('')
  if (!lineText.trim()) return null

  const markerMatch = lineText.match(/^([ \t]*)-\s+/)
  if (!markerMatch) return null

  const marker = markerMatch[0]
  const indent = markerMatch[1] ?? ''
  const indentWidth = indent.replace(/\t/g, '  ').length
  const level = Math.floor(indentWidth / 2)

  const nodes = stripLeadingChars(lineNodes, marker.length)

  return {
    level,
    nodes: nodes.length > 0 ? nodes : [{ type: 'text', text: '' }],
  }
}

const parseLegacyBulletParagraph = (nodes: LegacyTextNode[]): LegacyListEntry[] | null => {
  const lines = splitNodesIntoLines(nodes)
  const entries: LegacyListEntry[] = []

  for (const lineNodes of lines) {
    const lineText = lineNodes.map(getNodeText).join('')
    if (!lineText.trim()) continue

    const parsed = parseLegacyListEntry(lineNodes)
    if (!parsed) return null
    entries.push(parsed)
  }

  return entries.length > 0 ? entries : null
}

const buildLegacyListTree = (entries: LegacyListEntry[]): LegacyListItem[] => {
  const root: LegacyListItem[] = []
  const stack: Array<{ items: LegacyListItem[]; level: number }> = [{ items: root, level: -1 }]

  entries.forEach((entry) => {
    while (stack.length > 1 && entry.level <= stack[stack.length - 1].level) {
      stack.pop()
    }

    const previousLevel = stack[stack.length - 1].level
    const normalizedLevel = entry.level > previousLevel + 1 ? previousLevel + 1 : entry.level

    while (stack.length > 1 && normalizedLevel <= stack[stack.length - 1].level) {
      stack.pop()
    }

    const item: LegacyListItem = {
      children: [],
      nodes: entry.nodes,
    }

    stack[stack.length - 1].items.push(item)
    stack.push({
      items: item.children,
      level: normalizedLevel,
    })
  })

  return root
}

const renderLegacyList = (
  items: LegacyListItem[],
  nodesToJSX: (args: { nodes: any[] }) => ReactNode[],
  keyPrefix = 'legacy-list',
) => (
  <ul className="my-4 list-disc space-y-1 pl-6">
    {items.map((item, index) => {
      const key = `${keyPrefix}-${index}`

      return (
        <li key={key}>
          {nodesToJSX({ nodes: item.nodes as any[] })}
          {item.children.length > 0 && renderLegacyList(item.children, nodesToJSX, key)}
        </li>
      )
    })}
  </ul>
)

const splitTableCells = (line: string): string[] | null => {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null

  return trimmed
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())
}

const isTableDividerRow = (cells: string[]): boolean => {
  if (cells.length === 0) return false
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

const parseLegacyTableParagraph = (nodes: LegacyTextNode[]): LegacyTableData | null => {
  const lines = splitNodesIntoLines(nodes)
    .map((lineNodes) => lineNodes.map(getNodeText).join('').trim())
    .filter(Boolean)

  if (lines.length < 3) return null

  const headerCells = splitTableCells(lines[0])
  const dividerCells = splitTableCells(lines[1])
  if (!headerCells || !dividerCells) return null
  if (headerCells.length === 0 || headerCells.length !== dividerCells.length) return null
  if (!isTableDividerRow(dividerCells)) return null

  const rows: string[][] = []

  for (const line of lines.slice(2)) {
    const rowCells = splitTableCells(line)
    if (!rowCells || rowCells.length !== headerCells.length) return null
    rows.push(rowCells)
  }

  return {
    headers: headerCells,
    rows,
  }
}

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  if (relationTo === 'posts') return `/posts/${slug}`
  if (relationTo === 'people') return `/people/${slug}`
  if (relationTo === 'news') return `/news/${slug}`
  if (relationTo === 'research') return `/labs/${slug}`
  return `/${slug}`
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  paragraph: ({ node, nodesToJSX }) => {
    const children = Array.isArray(node.children) ? (node.children as LegacyTextNode[]) : []
    const paragraphText = children.map(getNodeText).join('')

    const legacyImage = parseLegacyImageTag(paragraphText)
    if (legacyImage) {
      return (
        <figure className="my-6">
          <img
            alt={legacyImage.alt}
            className="mx-auto h-auto max-w-full rounded-[0.8rem] border border-border"
            height={legacyImage.height}
            loading="lazy"
            src={legacyImage.src}
            width={legacyImage.width}
            style={legacyImage.widthStyle ? { width: legacyImage.widthStyle } : undefined}
          />
        </figure>
      )
    }

    const legacyEntries = parseLegacyBulletParagraph(children)
    if (legacyEntries) {
      const legacyTree = buildLegacyListTree(legacyEntries)
      return renderLegacyList(legacyTree, nodesToJSX)
    }

    const legacyTable = parseLegacyTableParagraph(children)
    if (legacyTable) {
      return (
        <div className="my-6 overflow-x-auto">
          <table className="w-full border-collapse text-center text-sm">
            <thead className="bg-muted/40">
              <tr>
                {legacyTable.headers.map((header, index) => (
                  <th
                    key={`legacy-table-header-${index}`}
                    className="border border-border/70 px-3 py-2 text-center align-middle font-semibold"
                  >
                    {header || ' '}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {legacyTable.rows.map((row, rowIndex) => (
                <tr key={`legacy-table-row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`legacy-table-cell-${rowIndex}-${cellIndex}`}
                      className="border border-border/70 px-3 py-2 text-center align-middle"
                    >
                      {cell || ' '}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    const renderedChildren = nodesToJSX({
      nodes: node.children,
    })

    if (!renderedChildren?.length) {
      return (
        <p>
          <br />
        </p>
      )
    }

    return <p>{renderedChildren}</p>
  },
  blocks: {
    banner: ({ node }) => <BannerBlock className="col-start-2 mb-4" {...node.fields} />,
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-start-1 col-span-3"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
    youtubeEmbed: ({ node }) => <YouTubeEmbedBlock className="col-start-1 col-span-3" {...node.fields} />,
  },
})

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, ...rest } = props
  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        'payload-richtext',
        {
          container: enableGutter,
          'max-w-none': !enableGutter,
          'mx-auto prose md:prose-md dark:prose-invert': enableProse,
        },
        className,
      )}
      {...rest}
    />
  )
}
