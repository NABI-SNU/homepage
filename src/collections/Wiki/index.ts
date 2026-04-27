import type { CollectionConfig } from 'payload'
import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { adminOnly } from '@/access/adminOnly'
import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { Banner } from '@/blocks/Banner/config'
import { Code } from '@/blocks/Code/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { YouTubeEmbed } from '@/blocks/YouTubeEmbed/config'
import { hasAdminRole } from '@/access/hasAdminRole'
import type { User } from '@/payload-types'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { slugField } from 'payload'

import { assignWikiOwner } from './hooks/assignOwner'
import { revalidateWiki, revalidateWikiDelete } from './hooks/revalidateWiki'
import { resolveOutgoingWikiLinks } from './hooks/resolveLinks'

export const Wiki: CollectionConfig = {
  slug: 'wiki',
  access: {
    create: authenticated,
    delete: adminOnly,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'createdBy', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          collection: 'wiki',
          req,
          slug: data?.slug,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        collection: 'wiki',
        req,
        slug: data?.slug as string,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      required: true,
      type: 'text',
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'aliases',
      admin: {
        description: 'Optional names used when resolving [[Wiki Links]].',
      },
      hasMany: true,
      type: 'text',
    },
    {
      name: 'tags',
      hasMany: true,
      relationTo: 'tags',
      type: 'relationship',
    },
    {
      name: 'content',
      required: true,
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            BlocksFeature({ blocks: [Banner, Code, MediaBlock, YouTubeEmbed] }),
            EXPERIMENTAL_TableFeature(),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
      access: {
        update: ({ req: { user } }) => hasAdminRole(user as User | null | undefined),
      },
      index: true,
    },
    {
      name: 'outgoingLinks',
      admin: {
        description: 'Auto-generated from internal links and [[Wiki Links]] in content.',
        readOnly: true,
      },
      hasMany: true,
      relationTo: 'wiki',
      type: 'relationship',
    },
    {
      name: 'unresolvedWikiLinks',
      admin: {
        description: 'Wiki links that could not be resolved to an existing page.',
        initCollapsed: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'target',
          required: true,
          type: 'text',
        },
      ],
      type: 'array',
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidateWiki],
    afterDelete: [revalidateWikiDelete],
    beforeChange: [assignWikiOwner, resolveOutgoingWikiLinks],
  },
  versions: {
    drafts: {
      autosave: false,
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
