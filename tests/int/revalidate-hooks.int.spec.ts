import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

const filesWithoutEditorRevalidation = [
  '/Users/bazelcu/projects/homepage/src/Header/config.ts',
  '/Users/bazelcu/projects/homepage/src/Footer/config.ts',
  '/Users/bazelcu/projects/homepage/src/globals/AboutPage/config.ts',
  '/Users/bazelcu/projects/homepage/src/globals/HomePage/config.ts',
  '/Users/bazelcu/projects/homepage/src/collections/Posts/index.ts',
  '/Users/bazelcu/projects/homepage/src/collections/News/index.ts',
  '/Users/bazelcu/projects/homepage/src/collections/Announcements/index.ts',
  '/Users/bazelcu/projects/homepage/src/collections/Research/index.ts',
  '/Users/bazelcu/projects/homepage/src/collections/Wiki/index.ts',
  '/Users/bazelcu/projects/homepage/src/collections/Activities/index.ts',
  '/Users/bazelcu/projects/homepage/src/collections/Tags/index.ts',
  '/Users/bazelcu/projects/homepage/src/collections/People/index.ts',
  '/Users/bazelcu/projects/homepage/src/plugins/index.ts',
]

describe('Editor revalidation wiring', () => {
  it.each(filesWithoutEditorRevalidation)(
    'removes afterChange revalidation wiring from %s',
    async (filePath) => {
      const source = await readFile(filePath, 'utf8')

      expect(source).not.toMatch(/afterChange:\s*\[[^\]]*revalidate/i)
    },
  )
})
