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
import { adminOrPublished } from '@/access/adminOrPublished'
import { hideFromNonAdmins } from '@/access/hideFromNonAdmins'
import { Banner } from '@/blocks/Banner/config'
import { Code } from '@/blocks/Code/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { YouTubeEmbed } from '@/blocks/YouTubeEmbed/config'
import { referenceFields } from '@/fields/referenceFields'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import {
  revalidateAnnouncements,
  revalidateAnnouncementsDelete,
} from './hooks/revalidateAnnouncements'

const announcementsEditor = lexicalEditor({
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
})

export const Announcements: CollectionConfig<'announcements'> = {
  slug: 'announcements',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOrPublished,
    update: adminOnly,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    description: true,
    publishedAt: true,
    image: true,
    meta: {
      image: true,
      description: true,
      title: true,
    },
  },
  admin: {
    hidden: hideFromNonAdmins,
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'publishedAt', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          collection: 'announcements',
          slug: data?.slug,
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        collection: 'announcements',
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
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
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
      editor: announcementsEditor,
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
    afterChange: [revalidateAnnouncements],
    afterDelete: [revalidateAnnouncementsDelete],
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
