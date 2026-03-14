import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { adminOnly } from '../../access/adminOnly'
import { hideFromNonAdmins } from '../../access/hideFromNonAdmins'
import { slugField } from 'payload'
import { revalidateTags, revalidateTagsDelete } from './hooks/revalidateTags'

export const Tags: CollectionConfig<'tags'> = {
  slug: 'tags',
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
  hooks: {
    afterChange: [revalidateTags],
    afterDelete: [revalidateTagsDelete],
  },
}
