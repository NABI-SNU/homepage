import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { hideFromNonAdmins } from '@/access/hideFromNonAdmins'
// import { revalidateContactPage } from './hooks/revalidateContactPage'  // TEMP: disabled to test if afterChange causes form overwrite

export const ContactPage: GlobalConfig = {
  slug: 'contactPage',
  admin: {
    hidden: hideFromNonAdmins,
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'tagline',
      type: 'text',
      defaultValue: 'Contact',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      defaultValue: "Let's Connect!",
      required: true,
    },
    {
      name: 'formTitle',
      type: 'text',
      required: true,
    },
    {
      name: 'formSubtitle',
      type: 'textarea',
    },
    {
      name: 'formAction',
      type: 'text',
      required: true,
    },
    {
      name: 'formDescription',
      type: 'text',
    },
    {
      name: 'disclaimer',
      type: 'textarea',
    },
    {
      name: 'supportTitle',
      type: 'text',
      defaultValue: 'We are here to help!',
    },
    {
      name: 'supportItems',
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
  ],
  hooks: {
    // afterChange: [revalidateContactPage],  // TEMP: disabled to test form overwrite
  },
}
