import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { hideFromNonAdmins } from '@/access/hideFromNonAdmins'
import { revalidateHomePage } from './hooks/revalidateHomePage'

export const HomePage: GlobalConfig = {
  slug: 'homePage',
  admin: {
    hidden: hideFromNonAdmins,
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateHomePage],
  },
  fields: [
    {
      name: 'heroTagline',
      type: 'text',
      defaultValue: 'Natural and Artificial Brain Intelligence',
      required: true,
    },
    {
      name: 'heroTitle',
      type: 'text',
      defaultValue: 'NABI Labs',
      required: true,
    },
    {
      name: 'heroSubtitle',
      type: 'textarea',
      required: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'primaryCTA',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          defaultValue: 'Contact Us',
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
      name: 'secondaryCTA',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          defaultValue: 'Join Us',
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
      name: 'faqs',
      type: 'array',
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'joinTitle',
      type: 'text',
      defaultValue: 'Join Us',
      required: true,
    },
    {
      name: 'joinSubtitle',
      type: 'textarea',
    },
    {
      name: 'joinPrimaryCTA',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
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
      name: 'joinSecondaryCTA',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
