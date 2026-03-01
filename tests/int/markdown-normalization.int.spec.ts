import { describe, expect, it } from 'vitest'

import { normalizeMarkdownForLexical } from '@/utilities/markdownToLexical'

describe('normalizeMarkdownForLexical', () => {
  it('converts tab-indented markdown outside fenced code blocks', () => {
    const input = ['- parent', '\t- child', '\t\t- grandchild'].join('\n')
    const output = normalizeMarkdownForLexical(input)

    expect(output).toBe(['- parent', '    - child', '        - grandchild'].join('\n'))
  })

  it('preserves tabs inside fenced code blocks', () => {
    const input = ['```python', 'for x in range(2):', '\tprint(x)', '```', '\t- nested list'].join('\n')
    const output = normalizeMarkdownForLexical(input)

    expect(output).toBe(['```python', 'for x in range(2):', '\tprint(x)', '```', '    - nested list'].join('\n'))
  })

  it('preserves pipe table markdown structure', () => {
    const input = [
      '| TEM | Transformer |',
      '| ---------------------- | ------------------------------ |',
      '| | |',
    ].join('\n')

    const output = normalizeMarkdownForLexical(input)
    expect(output).toBe(input)
  })
})
