import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { adminOnly } from '../access/adminOnly'
import { hideFromNonAdmins } from '../access/hideFromNonAdmins'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: anyone,
    update: adminOnly,
  },
  admin: {
    hidden: hideFromNonAdmins,
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
