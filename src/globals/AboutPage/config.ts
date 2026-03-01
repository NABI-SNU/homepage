import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { revalidateAboutPage } from './hooks/revalidateAboutPage'

export const AboutPage: GlobalConfig = {
  slug: 'aboutPage',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'tagline',
      type: 'text',
      defaultValue: 'About NABI',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Natural and Artificial Brain Intelligence',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'aboutItems',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'highlightTitle',
      type: 'text',
      defaultValue: 'Key Papers reviewed at NeuroAI',
    },
    {
      name: 'highlightSubtitle',
      type: 'textarea',
    },
    {
      name: 'highlights',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'latestPostsTitle',
      type: 'text',
      defaultValue: 'Read more about our research',
    },
    {
      name: 'latestPostsInfo',
      type: 'textarea',
    },
  ],
  hooks: {
    afterChange: [revalidateAboutPage],
  },
}
