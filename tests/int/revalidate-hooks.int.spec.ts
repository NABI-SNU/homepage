import { readFile } from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

const revalidationWiring = [
  {
    filePath: '/Users/bazelcu/projects/homepage/src/Header/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateHeader\s*\]/],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/Footer/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateFooter\s*\]/],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/globals/AboutPage/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateAboutPage\s*\]/],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/globals/HomePage/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateHomePage\s*\]/],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/globals/ContactPage/config.ts',
    patterns: [/afterChange:\s*\[\s*revalidateContactPage\s*\]/],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/collections/Posts/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidatePost\s*\]/,
      /afterDelete:\s*\[\s*revalidateDelete\s*\]/,
    ],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/collections/News/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateNews\s*\]/,
      /afterDelete:\s*\[\s*revalidateNewsDelete\s*\]/,
    ],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/collections/Announcements/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateAnnouncements\s*\]/,
      /afterDelete:\s*\[\s*revalidateAnnouncementsDelete\s*\]/,
    ],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/collections/Research/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateResearch\s*\]/,
      /afterDelete:\s*\[\s*revalidateResearchDelete\s*\]/,
    ],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/collections/Wiki/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateWiki\s*\]/,
      /afterDelete:\s*\[\s*revalidateWikiDelete\s*\]/,
    ],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/collections/Activities/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateActivities\s*\]/,
      /afterDelete:\s*\[\s*revalidateActivitiesDelete\s*\]/,
    ],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/collections/Tags/index.ts',
    patterns: [
      /afterChange:\s*\[\s*revalidateTags\s*\]/,
      /afterDelete:\s*\[\s*revalidateTagsDelete\s*\]/,
    ],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/collections/People/index.ts',
    patterns: [
      /afterChange:\s*\[\s*syncResearchTagsFromPerson\s*,\s*revalidatePerson\s*\]/,
      /afterDelete:\s*\[\s*revalidatePersonDelete\s*\]/,
    ],
  },
  {
    filePath: '/Users/bazelcu/projects/homepage/src/plugins/index.ts',
    patterns: [/afterChange:\s*\[\s*revalidateRedirects\s*\]/],
  },
]

describe('Editor revalidation wiring', () => {
  it.each(revalidationWiring)(
    'keeps revalidation hooks wired in $filePath',
    async ({ filePath, patterns }) => {
      const source = await readFile(filePath, 'utf8')

      for (const pattern of patterns) {
        expect(source).toMatch(pattern)
      }
    },
  )
})
