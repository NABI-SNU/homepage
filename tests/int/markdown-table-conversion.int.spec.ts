import { describe, expect, it } from 'vitest'

import { markdownToLexicalByCollection } from '@/utilities/markdownToLexical'

describe('markdownToLexicalByCollection table conversion', () => {
  it('converts pipe tables to lexical table nodes', async () => {
    const markdown = [
      '| TEM | Transformer |',
      '| ---------------------- | ------------------------------ |',
      '| $y = \\alpha QK^TV$ | $y = softmax(QK^T)V$ |',
    ].join('\n')

    const lexical = await markdownToLexicalByCollection(markdown, 'research')
    const children = lexical.root?.children ?? []

    const hasTableNode = children.some((node) => node?.type === 'table')
    expect(hasTableNode).toBe(true)
  })
})
