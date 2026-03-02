import type { Access, CollectionConfig, Where } from 'payload'

import { adminOnly } from '../../access/adminOnly'
import { revalidatePerson, revalidatePersonDelete } from './hooks/revalidatePeople'
import { syncResearchTagsFromPerson } from './hooks/syncResearchTags'
import { slugField } from 'payload'
import { parseResearchTags } from '@/utilities/researchTags'
import { hasAdminRole } from '@/access/hasAdminRole'
import { isAdminRequest } from '@/access/adminOnly'

const publicReadablePeople: Access = async ({ req }) => {
  const user = req.user

  if (user && (hasAdminRole(user) || (await isAdminRequest(req)))) {
    return true
  }

  if (user?.id) {
    return {
      or: [
        {
          isVisible: {
            equals: true,
          },
        },
        {
          user: {
            equals: user.id,
          },
        },
      ],
    } as Where
  }

  return {
    isVisible: {
      equals: true,
    },
  } as Where
}

const adminOrOwnProfile: Access = async ({ req }) => {
  const user = req.user
  if (!user) return false
  if (hasAdminRole(user) || (await isAdminRequest(req))) return true

  return {
    user: {
      equals: user.id,
    },
  }
}

export const People: CollectionConfig<'people'> = {
  slug: 'people',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: publicReadablePeople,
    update: adminOrOwnProfile,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'memberType', 'joinedYear', 'isAuthor', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      access: {
        update: ({ req }) => isAdminRequest(req),
      },
    },
    {
      name: 'memberType',
      type: 'select',
      options: [
        {
          label: 'User',
          value: 'user',
        },
        {
          label: 'Alumni',
          value: 'alumni',
        },
      ],
      access: {
        update: ({ req }) => isAdminRequest(req),
      },
      admin: {
        description: 'User records can log in. Alumni records cannot access admin APIs.',
      },
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      access: {
        update: ({ req }) => isAdminRequest(req),
      },
      admin: {
        description: 'Controls whether this person appears publicly in /people and profile pages.',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      unique: true,
      index: true,
      access: {
        update: ({ req }) => isAdminRequest(req),
      },
      admin: {
        description: 'Linked auth-enabled user identity.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'research',
      type: 'text',
      hasMany: true,
      admin: {
        description:
          'Research topics are stored as a list of strings and synced into the Tags collection for post tagging.',
        placeholder: 'Add one topic per item',
      },
    },
    {
      name: 'isAuthor',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'joinedYear',
      type: 'number',
      required: true,
      defaultValue: 2025,
      index: true,
      min: 1900,
      max: 2100,
      admin: {
        description: 'Year this member joined the group.',
      },
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'X', value: 'x' },
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'ORCID', value: 'orcid' },
            { label: 'Website', value: 'website' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
        },
      ],
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    slugField(),
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data || typeof data !== 'object' || !('research' in data)) return data

        const normalizedResearch = parseResearchTags(
          (data as { research?: string | string[] | null }).research,
        )

        return {
          ...data,
          research: normalizedResearch.length > 0 ? normalizedResearch : null,
        }
      },
    ],
    afterChange: [syncResearchTagsFromPerson, revalidatePerson],
    afterDelete: [revalidatePersonDelete],
  },
}
