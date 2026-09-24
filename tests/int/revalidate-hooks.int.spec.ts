import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const revalidationWiring = [
  {
    filePath: 'src/Header/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateHeader\s*\]/],
  },
  {
    filePath: 'src/Footer/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateFooter\s*\]/],
  },
  {
    filePath: 'src/globals/AboutPage/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateAboutPage\s*\]/],
  },
  {
    filePath: 'src/globals/HomePage/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateHomePage\s*\]/],
  },
  {
    filePath: 'src/globals/ContactPage/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateContactPage\s*\]/],
  },
  {
    filePath: 'src/collections/Posts/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidatePost\s*\]/,
      /afterDelete:\s*\[\s*revalidateDelete\s*\]/,
    ],
  },
  {
    filePath: 'src/collections/News/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateNews\s*\]/,
      /afterDelete:\s*\[\s*revalidateNewsDelete\s*\]/,
    ],
  },
  {
    filePath: 'src/collections/Announcements/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateAnnouncements\s*\]/,
      /afterDelete:\s*\[\s*revalidateAnnouncementsDelete\s*\]/,
    ],
  },
  {
    filePath: 'src/collections/Research/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateResearch\s*\]/,
      /afterDelete:\s*\[\s*revalidateResearchDelete\s*\]/,
    ],
  },
  {
    filePath: 'src/collections/Wiki/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateWiki\s*\]/,
      /afterDelete:\s*\[\s*revalidateWikiDelete\s*\]/,
    ],
  },
  {
    filePath: 'src/collections/Activities/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateActivities\s*\]/,
      /afterDelete:\s*\[\s*revalidateActivitiesDelete\s*\]/,
    ],
  },
  {
    filePath: 'src/collections/Tags/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateTags\s*\]/,
      /afterDelete:\s*\[\s*revalidateTagsDelete\s*\]/,
    ],
  },
  {
    filePath: 'src/collections/People/index.ts',
    patterns: [
      /afterChange:\s*\[\s*syncResearchTagsFromPerson\s*,\s*revalidatePerson\s*\]/,
      /afterDelete:\s*\[\s*revalidatePersonDelete\s*\]/,
    ],
  },
  {
    filePath: 'src/plugins/index.ts',
    patterns: [/afterChange:\s*\[\s*revalidateRedirects\s*\]/],
  },
]

describe('Editor revalidation wiring', () => {
  it.each(revalidationWiring)(
    'keeps revalidation hooks wired in $filePath',
    async ({ filePath, patterns }) => {
      const source = await readFile(path.resolve(process.cwd(), filePath), 'utf8')

      for (const pattern of patterns) {
        expect(source).toMatch(pattern)
      }
    },
  )
})
