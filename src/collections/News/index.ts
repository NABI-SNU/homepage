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
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
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
    read: authenticatedOrPublished,
    update: adminOnly,
  },
  admin: {
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
      autosave: false,
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
