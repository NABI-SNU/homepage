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

import { adminOnly } from '../../access/adminOnly'
import { adminOrPublished } from '../../access/adminOrPublished'
import { hideFromNonAdmins } from '@/access/hideFromNonAdmins'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { YouTubeEmbed } from '../../blocks/YouTubeEmbed/config'
import { referenceFields } from '../../fields/referenceFields'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { slugField } from 'payload'
import { revalidateNews, revalidateNewsDelete } from './hooks/revalidateNews'

export const News: CollectionConfig<'news'> = {
  slug: 'news',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublished,
    update: adminOnly,
  },
  admin: {
    hidden: hideFromNonAdmins,
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'date', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          collection: 'news',
          slug: data?.slug,
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        collection: 'news',
        slug: data?.slug as string,
        req,
      }),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
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
      name: 'references',
      type: 'array',
      fields: referenceFields,
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidateNews],
    afterDelete: [revalidateNewsDelete],
  },
  versions: {
    drafts: {
      // Persist the draft a few seconds after each change. A deployment going live mid-edit
      // forces a full page reload (Next.js's deployment-skew handling, no Skew Protection on
      // the Hobby plan), so this bounds what an editor can lose to the last few seconds.
      autosave: { interval: 3000 },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
