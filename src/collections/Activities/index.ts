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
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { Banner } from '@/blocks/Banner/config'
import { Code } from '@/blocks/Code/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { YouTubeEmbed } from '@/blocks/YouTubeEmbed/config'
import { referenceFields } from '@/fields/referenceFields'
import { getActivityPreviewPath } from '@/utilities/activityURL'
import { ensureSymposiumExistsBeforeChange, ensureSymposiumExistsBeforeDelete } from './hooks/ensureSymposiumExists'
import { revalidateActivities, revalidateActivitiesDelete } from './hooks/revalidateActivities'

export const Activities: CollectionConfig<'activities'> = {
  slug: 'activities',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: authenticatedOrPublished,
    update: adminOnly,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    description: true,
    activityType: true,
    date: true,
    location: true,
    heroImage: true,
    relatedPosts: true,
    relatedResearch: true,
    meta: {
      image: true,
      description: true,
      title: true,
    },
  },
  admin: {
    defaultColumns: ['title', 'activityType', 'date', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data }) =>
        getActivityPreviewPath({
          activityType: data?.activityType as 'symposium' | 'conference' | undefined,
          slug: data?.slug as string | undefined,
        }),
    },
    preview: (data) =>
      getActivityPreviewPath({
        activityType: data?.activityType as 'symposium' | 'conference' | undefined,
        slug: data?.slug as string | undefined,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'activityType',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'conference',
      options: [
        {
          label: 'Symposium',
          value: 'symposium',
        },
        {
          label: 'Conference',
          value: 'conference',
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'heroImage',
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
      name: 'relatedPosts',
      type: 'relationship',
      hasMany: true,
      relationTo: 'posts',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'relatedResearch',
      type: 'relationship',
      hasMany: true,
      relationTo: 'research',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'references',
      type: 'array',
      fields: referenceFields,
    },
    {
      name: 'meta',
      type: 'group',
      label: 'SEO',
      fields: [
        OverviewField({
          titlePath: 'meta.title',
          descriptionPath: 'meta.description',
          imagePath: 'meta.image',
        }),
        MetaTitleField({ hasGenerateFn: true }),
        MetaImageField({ relationTo: 'media' }),
        MetaDescriptionField({}),
        PreviewField({
          hasGenerateFn: true,
          titlePath: 'meta.title',
          descriptionPath: 'meta.description',
        }),
      ],
    },
    slugField(),
  ],
  hooks: {
    beforeChange: [ensureSymposiumExistsBeforeChange],
    beforeDelete: [ensureSymposiumExistsBeforeDelete],
    afterChange: [revalidateActivities],
    afterDelete: [revalidateActivitiesDelete],
  },
  versions: {
    drafts: {
      autosave: false,
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
